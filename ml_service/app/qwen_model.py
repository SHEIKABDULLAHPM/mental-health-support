"""
Qwen model integration: loading, text generation, streaming, and optional LoRA/QLoRA adapters.

This module provides a thin wrapper around Hugging Face `transformers` for Qwen2-1.5B (Instruct).
It supports:
- Non-streaming and streaming generation (server-sent events friendly)
- Multilingual inputs (Qwen2-Instruct tokenizer/model)
- Optional PEFT LoRA adapters loading (if available)

Note: Fine-tuning is handled in datasets/fine_tune.py; this file only loads adapters if present.
"""
from __future__ import annotations

import os
import logging
from typing import Dict, Generator, Iterable, Optional

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TextIteratorStreamer,
)

try:
    from peft import PeftModel
    PEFT_AVAILABLE = True
except Exception:
    PEFT_AVAILABLE = False

logger = logging.getLogger(__name__)


DEFAULT_MODEL_NAME = os.getenv("QWEN_MODEL_NAME", "Qwen/Qwen2-1.5B-Instruct")
DEFAULT_DEVICE_MAP = os.getenv("DEVICE_MAP", "auto")
DEFAULT_DTYPE = os.getenv("TORCH_DTYPE", "bfloat16").lower()  # "float16" | "bfloat16" | "float32"


def _get_dtype():
    if DEFAULT_DTYPE == "float16":
        return torch.float16
    if DEFAULT_DTYPE == "bfloat16":
        return torch.bfloat16
    return torch.float32


class QwenModel:
    """Wrapper for Qwen text generation with streaming support."""

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL_NAME,
        peft_adapter_path: Optional[str] = None,
    ) -> None:
        self.model_name = model_name
        self.peft_adapter_path = peft_adapter_path
        self.device_map = DEFAULT_DEVICE_MAP
        self.dtype = _get_dtype()
        self._load()

    def _load(self) -> None:
        logger.info(f"Loading model {self.model_name} (device_map={self.device_map}, dtype={self.dtype})")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, use_fast=True)
        
        # Set padding token if not already set
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # Determine actual device to use
        # IMPORTANT: Don't use device_map="auto" as it splits model across devices causing device mismatch
        # Instead, load entire model on single device (cuda if available, else cpu)
        if self.device_map == "auto":
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(self.device_map)
        
        # Load model entirely on single device to prevent device mismatch errors
        logger.info(f"Loading model on device: {self.device}")
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            torch_dtype=self.dtype,
            low_cpu_mem_usage=True,  # Optimize memory usage
        ).to(self.device)
        
        # Enable optimizations for faster inference
        self.model.eval()  # Set to evaluation mode
        if torch.cuda.is_available() and self.device.type == "cuda":
            # Enable TF32 for faster computation on Ampere GPUs
            torch.backends.cuda.matmul.allow_tf32 = True
            torch.backends.cudnn.allow_tf32 = True
            logger.info("✓ CUDA optimizations enabled (TF32)")

        # PEFT: optional single adapter path and/or per-mode adapters
        self.adapters: Dict[str, str] = {}
        self.current_adapter: Optional[str] = None
        if PEFT_AVAILABLE:
            # Discover per-mode adapters from env
            self._discover_mode_adapters()
            base_adapter = self.peft_adapter_path or None
            try:
                # If we have any adapter path, initialize PeftModel with one, then load others
                initial_path = base_adapter or next(iter(self.adapters.values()), None)
                if initial_path:
                    logger.info(f"Initializing PEFT with adapter: {initial_path}")
                    self.model = PeftModel.from_pretrained(self.model, initial_path)
                    # Load remaining adapters with distinct names
                    for name, path in self.adapters.items():
                        if path != initial_path:
                            try:
                                self.model.load_adapter(path, adapter_name=name)
                                logger.info(f"Loaded additional adapter '{name}' from {path}")
                            except Exception as e:
                                logger.warning(f"Failed loading adapter '{name}': {e}")
                    # Name for the initially loaded adapter
                    if base_adapter and "default" not in self.adapters:
                        self.adapters.setdefault("default", base_adapter)
            except Exception as e:
                logger.error(f"PEFT initialization failed: {e}")

        self.model.eval()

    def build_prompt(self, system_prompt: str, history: Iterable[Dict[str, str]], user_message: str) -> str:
        """Compose a chat-style prompt leveraging the Instruct format.

        For Qwen2-Instruct, simple role-tagged concatenation works; adjust as needed if using chat templates.
        """
        messages = []
        if system_prompt:
            messages.append(f"<|system|>\n{system_prompt}\n")
        for turn in history:
            if turn.get("role") == "user":
                messages.append(f"<|user|>\n{turn.get('content','')}\n")
            elif turn.get("role") == "assistant":
                messages.append(f"<|assistant|>\n{turn.get('content','')}\n")
        messages.append(f"<|user|>\n{user_message}\n<|assistant|>\n")
        return "".join(messages)

    # --- Adapter management ---
    def _discover_mode_adapters(self) -> None:
        """Populate adapters dict from environment variables."""
        # Normalize to our internal keys
        env_map = {
            "therapeutic": os.getenv("PEFT_ADAPTER_PATH_THERAPEUTIC"),
            "emotional": os.getenv("PEFT_ADAPTER_PATH_EMOTIONAL") or os.getenv("PEFT_ADAPTER_PATH_EMOTIONAL_SUPPORT"),
            "informational": os.getenv("PEFT_ADAPTER_PATH_INFORMATIONAL"),
        }
        self.adapters = {k: v for k, v in env_map.items() if v}

    def switch_adapter(self, mode: Optional[str]) -> None:
        """Switch to an adapter matching the mode, if available. No-op if PEFT not available or adapter missing."""
        if not (PEFT_AVAILABLE and mode):
            return
        name = self._normalize_mode(mode)
        path = self.adapters.get(name)
        if not path:
            return
        try:
            # If model is already a PEFT model, set or load adapter
            if hasattr(self.model, "set_adapter"):
                # Ensure loaded
                if name not in getattr(self.model, "peft_config", {}):
                    self.model.load_adapter(path, adapter_name=name)
                self.model.set_adapter(name)
                self.current_adapter = name
                logger.info(f"Switched PEFT adapter to '{name}'")
            else:
                # Wrap into PeftModel with this adapter
                self.model = PeftModel.from_pretrained(self.model, path)
                self.current_adapter = name
                logger.info(f"Enabled PEFT adapter '{name}'")
        except Exception as e:
            logger.warning(f"Adapter switch failed for '{name}': {e}")

    @staticmethod
    def _normalize_mode(mode: str) -> str:
        m = mode.strip().lower()
        if "therap" in m:
            return "therapeutic"
        if "emot" in m:
            return "emotional"
        if "info" in m:
            return "informational"
        return m

    def generate(
        self,
        prompt: str,
        max_new_tokens: int = 256,
        temperature: float = 0.7,
        top_p: float = 0.9,
        stop: Optional[list[str]] = None,
    ) -> str:
        # Ensure inputs are on the correct device
        inputs = self.tokenizer(prompt, return_tensors="pt", padding=True, truncation=True, max_length=512)
        # Move inputs to the same device as model
        if hasattr(self, 'device'):
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
        else:
            # Fallback: try to get device from model
            device = next(self.model.parameters()).device
            inputs = {k: v.to(device) for k, v in inputs.items()}
        
        with torch.no_grad():
            # Use torch.inference_mode() for faster inference
            with torch.inference_mode():
                output_ids = self.model.generate(
                    **inputs,
                    do_sample=temperature > 0,
                    temperature=max(temperature, 0.01),  # Avoid temperature=0
                    top_p=top_p,
                    top_k=50,  # Add top-k sampling for better quality
                    max_new_tokens=max_new_tokens,
                    pad_token_id=self.tokenizer.pad_token_id or self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    repetition_penalty=1.1,  # Reduce repetition
                    num_beams=1,  # Use greedy/sampling (faster than beam search)
                    use_cache=True,  # Enable KV cache for speed
                )
        full_text = self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
        # Return only the assistant continuation after the last `<|assistant|>`
        if "<|assistant|>" in full_text:
            return full_text.split("<|assistant|>")[-1].strip()
        return full_text

    def stream(
        self,
        prompt: str,
        max_new_tokens: int = 256,
        temperature: float = 0.7,
        top_p: float = 0.9,
    ) -> Generator[str, None, None]:
        """Yield tokens/chunks incrementally for streaming responses."""
        # Ensure inputs are on the correct device
        inputs = self.tokenizer(prompt, return_tensors="pt", padding=True, truncation=True, max_length=512)
        if hasattr(self, 'device'):
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
        else:
            device = next(self.model.parameters()).device
            inputs = {k: v.to(device) for k, v in inputs.items()}
        
        streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True, skip_special_tokens=True)

        gen_kwargs = dict(
            **inputs,
            streamer=streamer,
            do_sample=temperature > 0,
            temperature=max(temperature, 0.01),
            top_p=top_p,
            top_k=50,
            max_new_tokens=max_new_tokens,
            pad_token_id=self.tokenizer.pad_token_id or self.tokenizer.eos_token_id,
            eos_token_id=self.tokenizer.eos_token_id,
            repetition_penalty=1.1,
            num_beams=1,
            use_cache=True,
        )

        # Run generation in background thread
        import threading
        thread = threading.Thread(target=self.model.generate, kwargs=gen_kwargs)
        thread.start()

        for text in streamer:
            yield text
