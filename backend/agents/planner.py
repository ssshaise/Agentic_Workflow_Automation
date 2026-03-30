from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ValidationError

try:
    from ..gemini_client import GeminiClient
except ImportError:
    from gemini_client import GeminiClient

class PlanStep(BaseModel):
    id: str
    action: Literal["web_search", "summarize_content", "db_store", "email_sender", "http_client", "python_exec", "file_system"]
    inputs: Dict[str, Any]

class PlannerAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.client = GeminiClient(api_key=api_key) if api_key else None

    def breakdown(self, task: str) -> List[PlanStep]:
        local_plan = self._build_local_plan(task)
        if self.client is None:
            return local_plan
        prompt = (
            "Decompose the user task into an ordered execution plan.\n"
            "Return valid JSON only.\n"
            "Do not use markdown fences.\n"
            "Escape quotes inside strings correctly.\n"
            "Return a JSON array where each item has exactly these fields: id, action, inputs.\n"
            "Use tool-friendly action names such as web_search, python_exec, email_sender, db_store, file_system, http_client.\n"
            "User task:\n"
            f"{task}\n"
            "Example:\n"
            "[{\"id\":\"step1\",\"action\":\"web_search\",\"inputs\":{\"query\":\"latest arxiv agent papers\",\"max_results\":3}}]"
        )
        try:
            plan_obj = self.client.generate_json(prompt, max_output_tokens=1200)
            parsed = [PlanStep(**x) for x in plan_obj]
            return parsed or local_plan
        except (ValueError, ValidationError, TypeError, KeyError):
            return local_plan

    def _build_local_plan(self, task: str) -> List[PlanStep]:
        lowered = task.lower()
        steps: List[PlanStep] = []
        query = task.strip()
        for token in ["fetch", "search", "find", "latest", "about", "on", "for"]:
            if token in lowered:
                query = task.lower().split(token, 1)[1].strip(" .").replace("->", " ")
                break
        if any(token in lowered for token in ["fetch", "search", "latest", "arxiv", "web"]):
            steps.append(PlanStep(id="step1", action="web_search", inputs={"query": query, "max_results": 5}))
        if any(token in lowered for token in ["summarize", "summary", "digest", "show output"]):
            steps.append(PlanStep(id=f"step{len(steps)+1}", action="summarize_content", inputs={"data": {"papers": []}, "max_items": 5}))
        if any(token in lowered for token in ["store", "save", "db", "database"]):
            steps.append(PlanStep(id=f"step{len(steps)+1}", action="db_store", inputs={"operation": "save_summary", "task": task, "summary": "Workflow summary placeholder"}))
        if any(token in lowered for token in ["email", "mail", "send"]):
            steps.append(PlanStep(id=f"step{len(steps)+1}", action="email_sender", inputs={"to": "draft-only", "subject": "Workflow Result", "body": "Workflow completed."}))
        return steps or [PlanStep(id="step1", action="python_exec", inputs={"code": "result = 'No-op workflow executed'"})]
