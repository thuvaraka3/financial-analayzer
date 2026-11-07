from flask import current_app

class GeminiProvider:
    def __init__(self, api_key=None):
        self.api_key = api_key
        self._model = None
        self._vision_model = None

    def _get_api_key(self):
        if self.api_key:
            return self.api_key
        try:
            return current_app.config.get('GEMINI_API_KEY', '')
        except RuntimeError:
            return ''

    def _get_model(self):
        if self._model is None:
            import google.generativeai as genai
            key = self._get_api_key()
            if key:
                genai.configure(api_key=key)
            self._model = genai.GenerativeModel('gemini-flash-latest')
        return self._model

    def _get_vision_model(self):
        if self._vision_model is None:
            import google.generativeai as genai
            key = self._get_api_key()
            if key:
                genai.configure(api_key=key)
            self._vision_model = genai.GenerativeModel('gemini-flash-latest')
        return self._vision_model

    def chat(self, message, context=None):
        model = self._get_model()
        system_prompt = """You are FinSightAI Assistant, an intelligent financial assistant. Help users understand their financial situation, analyze income and expenses, explain reports, provide budgeting advice, monitor savings goals, identify unusual transactions, generate financial insights, and support informed financial decisions. Always provide accurate, professional, user-friendly, data-driven responses. Use LKR as currency."""
        full_prompt = system_prompt
        if context:
            full_prompt += f"\n\nUser Financial Context:\n{context}"
        full_prompt += f"\n\nUser Message: {message}"
        response = model.generate_content(full_prompt)
        return response.text

    def analyze_receipt(self, image_data):
        model = self._get_vision_model()
        prompt = """Extract the following information from this receipt image and return as JSON: {"merchantName": "", "date": "YYYY-MM-DD", "amount": 0.0, "category": "Food/Transport/Bills/Shopping/Entertainment/Healthcare/Other", "items": [], "description": ""} Only return the JSON object."""
        response = model.generate_content([prompt, image_data])
        return response.text

    def generate_report(self, financial_data):
        model = self._get_model()
        prompt = f"""Generate a detailed monthly financial report in markdown from this data:\n{financial_data}\n\nInclude: Executive Summary, Income Analysis, Expense Analysis, Budget Performance, Savings Review, Recommendations."""
        response = model.generate_content(prompt)
        return response.text

    def analyze_anomaly(self, transaction_data):
        model = self._get_model()
        prompt = f"""Analyze this flagged transaction for potential fraud:\n{transaction_data}\n\nExplain why it might be unusual."""
        response = model.generate_content(prompt)
        return response.text

    def generate_insights(self, financial_summary):
        model = self._get_model()
        prompt = f"""You are FinSightAI Assistant. Based on this financial summary, provide 3 concise actionable financial insights and tips for the user. Be specific and practical. Use LKR as currency.

Financial Summary:
{financial_summary}

Return exactly 3 insights as a JSON array of objects with "insight" (the tip) and "type" (one of: savings, spending, budget, goal, general) keys."""
        response = model.generate_content(prompt)
        return response.text
