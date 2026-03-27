import json
from pydantic import BaseModel
from typing import List, Dict, Any
from openai import OpenAI
from config import OPENAI_API_KEY, OPENAI_MODEL

class PlanStep(BaseModel):
    id: str
    action: str
    inputs: Dict[str, Any]

class PlannerAgent:
    def __init__(self):
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable must be set")
        self.client = OpenAI(api_key=OPENAI_API_KEY)

    def breakdown(self, task: str) -> List[PlanStep]:
        prompt = (
            f"Decompose this user task into an ordered plan with named steps:\n" 
            f"{task}\n"
            "Return JSON array with id, action, inputs fields. Example:"
            " [{\"id\": \"step1\", \"action\": \"search_paper\", \"inputs\": {\"query\": \"...\"}}]"
        )
        response = self.client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
        )
        text = response.choices[0].message.content
        plan_obj = json.loads(text)
        return [PlanStep(**x) for x in plan_obj]
