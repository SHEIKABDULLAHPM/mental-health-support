from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

class QwenModel:
    def __init__(self, model_name, device='cpu'):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(model_name).to(device)

    def generate_response(self, prompt, max_length=256, temperature=0.7):
        inputs = self.tokenizer(prompt, return_tensors='pt').to(self.model.device)
        output = self.model.generate(
            **inputs,
            max_length=max_length,
            temperature=temperature,
            do_sample=True,
            pad_token_id=self.tokenizer.eos_token_id
        )
        return self.tokenizer.decode(output[0], skip_special_tokens=True)