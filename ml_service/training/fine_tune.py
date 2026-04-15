"""
LoRA fine-tuning for Qwen on GoEmotions (and optional DAIC-WOZ) with safer device handling.

Run (Windows PowerShell):
  python .\training\fine_tune.py --output_dir .\qwen-emotion --epochs 2 --per_device_batch 2 --max_length 512

Or as a module:
  python -m training.fine_tune --output_dir .\qwen-emotion
"""
from __future__ import annotations

import argparse
import os
from typing import Optional

import torch
from datasets import load_dataset, DatasetDict, Dataset, concatenate_datasets
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)

try:
    from peft import LoraConfig, get_peft_model
except Exception as e:
    raise RuntimeError("peft is required for LoRA fine-tuning. pip install peft")


def is_bf16_supported() -> bool:
    try:
        return torch.cuda.is_available() and torch.cuda.is_bf16_supported()
    except Exception:
        return False


def load_goemotions(split: str = "raw", mode: Optional[str] = None) -> DatasetDict:
    ds = load_dataset("go_emotions", split)
    label_names = ds["train"].features["labels"].feature.names if "labels" in ds["train"].features else []

    # Normalize mode for prompts
    mode_key = (mode or "").lower()
    if "therap" in mode_key:
        mode_key = "therapeutic"
    elif "emot" in mode_key:
        mode_key = "emotional"
    elif "info" in mode_key:
        mode_key = "informational"
    else:
        mode_key = None

    mode_system = {
        "therapeutic": "You are a therapeutic assistant using evidence-based guidance (CBT/DBT/Mindfulness).",
        "emotional": "You are an emotionally supportive assistant prioritizing empathy and validation.",
        "informational": "You are an informative assistant providing concise, actionable guidance.",
    }

    def to_text(example):
        text = example.get("text", "")
        labels = example.get("labels", [])
        label_words = ", ".join(label_names[i] for i in labels) if label_names and labels else "neutral"
        sys = f"<|system|>\n{mode_system.get(mode_key, '')}\n" if mode_key else ""
        prompt = f"{sys}<|user|>\n{text}\n<|assistant|>\nEmotion: {label_words}"
        return {"text": prompt}

    mapped = ds.map(to_text, remove_columns=ds["train"].column_names)
    return mapped


def load_daic_woz(path: str) -> DatasetDict:
    # Placeholder: implement your local loading here and return a DatasetDict with 'train' split and 'text' column
    from datasets import Dataset
    empty = Dataset.from_dict({"text": [], "label": []})
    return DatasetDict({"train": empty, "validation": empty})


def build_conversation_examples(mode: Optional[str]) -> Dataset:
    """Create a small in-memory dataset of conversational Q&A pairs with mode-aware style."""
    mk = (mode or "").lower()
    if "therap" in mk:
        mk = "therapeutic"
    elif "emot" in mk:
        mk = "emotional"
    elif "info" in mk:
        mk = "informational"
    else:
        mk = "therapeutic"  # default to supportive style

    sys_map = {
        "therapeutic": "You are a therapeutic assistant using evidence-based guidance (CBT/DBT/Mindfulness).",
        "emotional": "You are an emotionally supportive assistant prioritizing empathy and validation.",
        "informational": "You are an informative assistant providing concise, actionable guidance.",
    }

    pairs = [
        ("Hi", "Hi, I’m here with you. How are you feeling right now?"),
        ("Hello", "Hello. I’m glad you reached out. What’s on your mind today?"),
        ("Hey", "Hey. I’m here to listen—what would feel helpful to talk about?"),
        ("Good morning", "Good morning. How is your day starting, and how are you feeling?"),
        ("Good evening", "Good evening. Would you like to share how today went for you?"),
        ("I feel overwhelmed", "Thank you for sharing that. Let’s take this step-by-step. What’s the most pressing part of what you’re dealing with?"),
        ("I had an argument with a friend", "I’m sorry that happened. Conflicts can be tough. Would you like to explore what you felt and what you hope for next?"),
        ("I can’t focus on work", "That’s tough. We can try a brief grounding technique and then identify one small next step. Would that be okay?"),
        ("I feel anxious at night", "Nighttime anxiety is common. We can try a calming routine and grounding. What tends to help you feel safe before sleep?"),
        ("I’m sad and don’t know why", "I hear that. Emotions can be unclear. We can gently explore when you noticed this and what might be contributing—at a pace that feels safe."),
    ]

    out = []
    for user, assistant in pairs:
        sys = sys_map.get(mk, "")
        text = f"<|system|>\n{sys}\n<|user|>\n{user}\n<|assistant|>\n{assistant}"
        out.append({"text": text})
    return Dataset.from_dict({"text": [o["text"] for o in out]})


def tokenize_function(tokenizer, examples, max_length: int):
    return tokenizer(examples["text"], truncation=True, max_length=max_length)


def run_lora_finetune(
    model_name: str,
    output_dir: str,
    daic_woz_path: Optional[str] = None,
    epochs: int = 2,
    per_device_batch: int = 2,
    max_length: int = 512,
    use_fp16: Optional[bool] = None,
    use_bf16: Optional[bool] = None,
    mode: Optional[str] = None,
    limit: Optional[int] = None,
    seed: int = 42,
):
    tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True)

    # Load without device_map to avoid meta tensor offloading; let Trainer move to device
    dtype = torch.bfloat16 if is_bf16_supported() else (torch.float16 if torch.cuda.is_available() else torch.float32)
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=dtype,
        low_cpu_mem_usage=True,
    )

    lora_cfg = LoraConfig(r=8, lora_alpha=32, target_modules=["q_proj", "v_proj"], lora_dropout=0.1)
    model = get_peft_model(model, lora_cfg)

    goemo = load_goemotions("raw", mode=mode)
    train_ds = goemo["train"]

    # Build conversation augmentation and mix if requested (by limit logic below)
    conv_ds = build_conversation_examples(mode)

    # Mixing strategy: if limit provided, aim for total == limit with ~20% conversation examples
    if limit and limit > 0:
        conv_target = max(1, int(limit * 0.2))
        conv_take = min(conv_target, len(conv_ds))
        emo_take = max(0, min(limit - conv_take, len(train_ds)))
        # If train_ds is too small, adjust
        if conv_take + emo_take < limit and len(conv_ds) > conv_take:
            conv_take = min(limit - emo_take, len(conv_ds))
        sel_train = train_ds.shuffle(seed=seed).select(range(emo_take)) if emo_take > 0 else None
        sel_conv = conv_ds.shuffle(seed=seed).select(range(conv_take)) if conv_take > 0 else None
        if sel_train and sel_conv:
            mixed = concatenate_datasets([sel_train, sel_conv]).shuffle(seed=seed)
        else:
            mixed = sel_train or sel_conv
        tokenized_train = mixed.map(lambda ex: tokenize_function(tokenizer, ex, max_length), batched=True, remove_columns=["text"]) if mixed is not None else None
    else:
        # No limit: concatenate all (light augmentation)
        mixed = concatenate_datasets([train_ds, conv_ds]).shuffle(seed=seed)
        tokenized_train = mixed.map(lambda ex: tokenize_function(tokenizer, ex, max_length), batched=True, remove_columns=["text"])  

    # TODO: integrate DAIC-WOZ by mapping to conversational prompts and concatenating with GoEmotions
    if daic_woz_path:
        _ = load_daic_woz(daic_woz_path)

    if use_bf16 is None:
        use_bf16 = is_bf16_supported()
    if use_fp16 is None:
        use_fp16 = torch.cuda.is_available() and not use_bf16

    # Force-disable half precision on CPU to prevent Trainer errors
    if not torch.cuda.is_available():
        use_fp16 = False
        use_bf16 = False

    args = TrainingArguments(
        output_dir=output_dir,
        per_device_train_batch_size=per_device_batch,
        per_device_eval_batch_size=per_device_batch,
        num_train_epochs=epochs,
        learning_rate=1e-4,
        logging_steps=50,
        save_steps=500,
        eval_strategy="no",
        fp16=bool(use_fp16),
        bf16=bool(use_bf16),
        gradient_accumulation_steps=1,
    )

    collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    if tokenized_train is None or len(tokenized_train) == 0:
        raise RuntimeError("Training dataset is empty after mixing/limiting. Adjust --limit or data sources.")

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=tokenized_train,
        data_collator=collator,
    )

    trainer.train()
    os.makedirs(output_dir, exist_ok=True)
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)


def main():
    parser = argparse.ArgumentParser(description="LoRA fine-tuning for Qwen on GoEmotions")
    parser.add_argument("--model_name", default=os.getenv("QWEN_MODEL_NAME", "Qwen/Qwen2-1.5B-Instruct"))
    parser.add_argument("--output_dir", default="./qwen-emotion")
    parser.add_argument("--mode", default=None, help="Optional mode: therapeutic | emotional | informational")
    parser.add_argument("--daic_woz_path", default=None)
    parser.add_argument("--epochs", type=int, default=2)
    parser.add_argument("--per_device_batch", type=int, default=2)
    parser.add_argument("--max_length", type=int, default=512)
    parser.add_argument("--fp16", action="store_true")
    parser.add_argument("--bf16", action="store_true")
    parser.add_argument("--limit", type=int, default=None, help="Cap training examples to this number (e.g., 1000)")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    # If mode provided, place outputs under adapters/<mode>
    out_dir = args.output_dir
    if args.mode:
        mode_key = args.mode.lower()
        # Normalize to known keys
        if "therap" in mode_key:
            mode_key = "therapeutic"
        elif "emot" in mode_key:
            mode_key = "emotional"
        elif "info" in mode_key:
            mode_key = "informational"
        out_dir = os.path.join(args.output_dir, "adapters", mode_key)

    run_lora_finetune(
        model_name=args.model_name,
        output_dir=out_dir,
        daic_woz_path=args.daic_woz_path,
        epochs=args.epochs,
        per_device_batch=args.per_device_batch,
        max_length=args.max_length,
        use_fp16=args.fp16 if args.fp16 or args.bf16 else None,
        use_bf16=args.bf16 if args.fp16 or args.bf16 else None,
        mode=args.mode,
        limit=args.limit,
        seed=args.seed,
    )


if __name__ == "__main__":
    main()
