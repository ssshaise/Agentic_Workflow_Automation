from typing import Optional

try:
    from ..gemini_client import GeminiClient
except ImportError:
    from gemini_client import GeminiClient

class ValidatorAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.client = GeminiClient(api_key=api_key) if api_key else None

    def evaluate(self, step, result):
        audit = result.get("audit", {})
        if audit and not audit.get("success", False):
            return {"valid": False, "issue": f"Tool execution failed for {step.get('action')}"}
        if self.client is None:
            return {"valid": True, "issue": ""}
        prompt = (
            "You are a workflow validator.\n"
            "Return valid JSON only.\n"
            "Do not use markdown fences.\n"
            f"Step: {step}\n"
            f"Result: {result}\n"
            "Answer with JSON {\"valid\": true|false, \"issue\": \"...\"}."
        )
        try:
            return self.client.generate_json(prompt, max_output_tokens=200)
        except Exception:
            return {"valid": True, "issue": ""}
