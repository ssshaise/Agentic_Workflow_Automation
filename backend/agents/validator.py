import json
from openai import OpenAI
from config import OPENAI_API_KEY, OPENAI_MODEL

class ValidatorAgent:
    def __init__(self):
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable must be set")
        self.client = OpenAI(api_key=OPENAI_API_KEY)

    def evaluate(self, step, result):
        prompt = (
            "You are a workflow validator.\n"
            f"Step: {step}\n"
            f"Result: {result}\n"
            "Answer with JSON {\"valid\": true|false, \"issue\": \"...\"}."
        )
        response = self.client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
        )
        text = response.choices[0].message.content
        return json.loads(text)
