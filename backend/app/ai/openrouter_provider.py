import base64
import requests
from flask import current_app

def _image_data_uri(image_data):
    if isinstance(image_data, bytes):
        image_data = base64.b64encode(image_data).decode('utf-8')

    if image_data.startswith('/9j/'):
        mime = 'image/jpeg'
    elif image_data.startswith('iVBORw0KGgo'):
        mime = 'image/png'
    elif image_data.startswith('R0lGOD'):
        mime = 'image/gif'
    elif image_data.startswith('UklGR'):
        mime = 'image/webp'
    elif image_data.startswith('Qk'):
        mime = 'image/bmp'
    else:
        mime = 'image/jpeg'

    return f'data:{mime};base64,{image_data}'


class OpenRouterProvider:
    def __init__(self, api_key=None, base_url=None):
        self.api_key = api_key
        self.base_url = base_url

    def _get_config(self):
        if self.api_key and self.base_url:
            return self.api_key, self.base_url
        try:
            return (
                current_app.config.get('OPENROUTER_API_KEY', ''),
                current_app.config.get('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
            )
        except RuntimeError:
            return '', 'https://openrouter.ai/api/v1'

    def chat(self, message, context=None):
        api_key, base_url = self._get_config()
        if not api_key:
            raise ValueError('OpenRouter API key not configured')

        system_prompt = "You are FinSightAI Assistant, an intelligent financial assistant. Use LKR as currency."
        messages = [{"role": "system", "content": system_prompt}]
        if context:
            messages.append({"role": "system", "content": f"User Financial Context:\n{context}"})
        messages.append({"role": "user", "content": message})

        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {"model": "anthropic/claude-haiku-5.5", "messages": messages, "max_tokens": 500}

        response = requests.post(
            f"{base_url}/chat/completions",
            headers=headers, json=payload, timeout=30
        )
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']

    def analyze_receipt(self, image_data):
        api_key, base_url = self._get_config()
        if not api_key:
            raise ValueError('OpenRouter API key not configured')

        prompt = """Extract the following information from this receipt image and return as JSON: {"merchantName": "", "date": "YYYY-MM-DD", "amount": 0.0, "category": "Food/Transport/Bills/Shopping/Entertainment/Healthcare/Other", "items": [], "description": ""} Only return the JSON object."""

        messages = [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": _image_data_uri(image_data)}},
            ],
        }]

        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {"model": "google/gemini-3.8-flash", "messages": messages, "max_tokens": 900}

        response = requests.post(
            f"{base_url}/chat/completions",
            headers=headers, json=payload, timeout=60
        )
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']

    def generate_report(self, financial_data):
        api_key, base_url = self._get_config()
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "anthropic/claude-haiku-5.5",
            "messages": [
                {"role": "system", "content": "Generate a professional monthly financial report."},
                {"role": "user", "content": f"Generate a detailed monthly financial report from this data:\n{financial_data}"}
            ],
            "max_tokens": 1000
        }
        response = requests.post(f"{base_url}/chat/completions", headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']
