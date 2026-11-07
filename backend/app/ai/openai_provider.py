import requests
from flask import current_app

class OpenAIProvider:
    def __init__(self, api_key=None):
        self.api_key = api_key

    def _get_config(self):
        if self.api_key:
            return self.api_key
        try:
            return current_app.config.get('OPENAI_API_KEY', '')
        except RuntimeError:
            return ''

    def chat(self, message, context=None):
        api_key = self._get_config()
        if not api_key:
            raise ValueError('OpenAI API key not configured')

        system_prompt = "You are FinSightAI Assistant, an intelligent financial assistant. Use LKR as currency."
        messages = [{"role": "system", "content": system_prompt}]
        if context:
            messages.append({"role": "system", "content": f"User Financial Context:\n{context}"})
        messages.append({"role": "user", "content": message})

        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {"model": "gpt-3.5-turbo", "messages": messages, "max_tokens": 500}

        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers, json=payload, timeout=30
        )
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']

    def generate_report(self, financial_data):
        api_key = self._get_config()
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "Generate a professional monthly financial report."},
                {"role": "user", "content": f"Generate a detailed monthly financial report from this data:\n{financial_data}"}
            ],
            "max_tokens": 1000
        }
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers, json=payload, timeout=30
        )
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']
