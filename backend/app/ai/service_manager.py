import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIServiceManager:
    def __init__(self):
        self._gemini = None
        self._openrouter = None

    def _get_gemini(self):
        if self._gemini is None:
            from .gemini_provider import GeminiProvider
            self._gemini = GeminiProvider()
        return self._gemini

    def _get_openrouter(self):
        if self._openrouter is None:
            from .openrouter_provider import OpenRouterProvider
            self._openrouter = OpenRouterProvider()
        return self._openrouter

    def chat(self, message, context=None):
        try:
            result = self._get_gemini().chat(message, context)
            return result, 'gemini'
        except Exception as e:
            logger.warning(f"Gemini chat failed: {e}")

        try:
            result = self._get_openrouter().chat(message, context)
            return result, 'openrouter'
        except Exception as e:
            logger.warning(f"OpenRouter chat failed: {e}")

        return "I'm sorry, the AI service is currently unavailable. Please try again later.", None

    def analyze_receipt(self, image_data):
        try:
            result = self._get_gemini().analyze_receipt(image_data)
            return result, 'gemini'
        except Exception as e:
            logger.warning(f"Gemini receipt analysis failed: {e}")

        try:
            result = self._get_openrouter().analyze_receipt(image_data)
            return result, 'openrouter'
        except Exception as e:
            logger.warning(f"OpenRouter receipt analysis failed: {e}")

        return None, None

    def generate_report(self, financial_data):
        try:
            result = self._get_gemini().generate_report(financial_data)
            return result, 'gemini'
        except Exception as e:
            logger.warning(f"Gemini report generation failed: {e}")

        try:
            result = self._get_openrouter().generate_report(financial_data)
            return result, 'openrouter'
        except Exception as e:
            logger.warning(f"OpenRouter report generation failed: {e}")

        return None, None

    def analyze_anomaly(self, transaction_data):
        try:
            result = self._get_gemini().analyze_anomaly(transaction_data)
            return result, 'gemini'
        except Exception as e:
            logger.warning(f"Gemini anomaly analysis failed: {e}")

        try:
            result = self._get_openrouter().chat(
                f"Analyze this flagged transaction for potential fraud and explain why it might be unusual:\n{transaction_data}")
            return result, 'openrouter'
        except Exception as e:
            logger.warning(f"OpenRouter anomaly analysis failed: {e}")

        return "Unable to analyze anomaly at this time.", None

    def generate_insights(self, financial_summary):
        try:
            result = self._get_gemini().generate_insights(financial_summary)
            return result, 'gemini'
        except Exception as e:
            logger.warning(f"Gemini insights failed: {e}")

        try:
            prompt = f"""You are FinSightAI Assistant. Based on this financial summary, provide 3 concise actionable financial insights and tips for the user. Be specific and practical. Use LKR as currency.

Financial Summary:
{financial_summary}

Return exactly 3 insights as a JSON array of objects with "insight" (the tip) and "type" (one of: savings, spending, budget, goal, general) keys."""
            result = self._get_openrouter().chat(prompt)
            return result, 'openrouter'
        except Exception as e:
            logger.warning(f"OpenRouter insights failed: {e}")

        return None, None
