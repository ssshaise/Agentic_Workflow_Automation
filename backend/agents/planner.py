from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ValidationError

try:
    from ..gemini_client import GeminiClient
except ImportError:
    from gemini_client import GeminiClient

class PlanStep(BaseModel):
    id: str
    action: Literal[
        "web_search",
        "summarize_content",
        "db_store",
        "database_query",
        "email_sender",
        "http_client",
        "python_exec",
        "python_executor",
        "file_system",
    ]
    inputs: Dict[str, Any]

class PlannerAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.client = GeminiClient(api_key=api_key) if api_key else None

    def breakdown(self, task: str, past_executions: Optional[List[str]] = None) -> List[PlanStep]:
        local_plan = self._build_local_plan(task)
        if self.client is None:
            return local_plan
        memory_context = "\n".join(f"- {item}" for item in (past_executions or [])[:3]) or "- No relevant past executions found."
        prompt = (
            "You are an autonomous AI agent responsible for completing tasks from a high-level goal.\n"
            "You operate in a loop of THINK, PLAN, ACT, OBSERVE, and REFLECT.\n"
            "Always understand the goal first, generate a full plan before acting, then execute step-by-step.\n"
            "Use past executions to improve decisions when they are relevant.\n"
            "Decompose the user task into an ordered execution plan.\n"
            "Return valid JSON only.\n"
            "Do not use markdown fences.\n"
            "Escape quotes inside strings correctly.\n"
            "Return a JSON array where each item has exactly these fields: id, action, inputs.\n"
            "Prefer the available tool names from this runtime: web_search, python_executor, email_sender, database_query.\n"
            "If needed, you may also use compatible runtime tools: python_exec, db_store, summarize_content, file_system, http_client.\n"
            "Only include steps that can actually be executed by the available tools.\n"
            "Plan the whole task first, then list execution steps in the exact order they should run.\n"
            "Relevant past executions:\n"
            f"{memory_context}\n"
            "User task:\n"
            f"{task}\n"
            "Example:\n"
            "["
            "{\"id\":\"step1\",\"action\":\"web_search\",\"inputs\":{\"query\":\"latest arxiv agent papers\",\"max_results\":3}},"
            "{\"id\":\"step2\",\"action\":\"python_executor\",\"inputs\":{\"code\":\"result = 'Summarize fetched results'\"}}"
            "]"
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
        query = self._extract_query(task)
        if any(token in lowered for token in ["fetch", "search", "latest", "arxiv", "web"]):
            steps.append(PlanStep(id="step1", action="web_search", inputs={"query": query, "max_results": 5}))
        if any(token in lowered for token in ["summarize", "summary", "digest", "show output"]):
            steps.append(PlanStep(id=f"step{len(steps)+1}", action="summarize_content", inputs={"data": {"papers": []}, "max_items": 5}))
        if any(token in lowered for token in ["store", "save", "db", "database"]):
            steps.append(PlanStep(id=f"step{len(steps)+1}", action="database_query", inputs={"query": "save_summary", "task": task, "summary": "Workflow summary placeholder"}))
        if any(token in lowered for token in ["email", "mail", "send"]):
            steps.append(PlanStep(id=f"step{len(steps)+1}", action="email_sender", inputs={"to": "draft-only", "subject": "Workflow Result", "body": "Workflow completed."}))
        return steps or [PlanStep(id="step1", action="python_executor", inputs={"code": "result = 'No-op workflow executed'"})]

    def _extract_query(self, task: str) -> str:
        cleaned = re.sub(
            r"\b(?:and\s+)?(?:email|send)\s+(?:it\s+)?to\s+[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b.*$",
            "",
            task,
            flags=re.IGNORECASE,
        ).strip()
        cleaned = re.sub(
            r"\bfrom\s+(?:google|the\s+web|web|the\s+internet|internet)\b.*$",
            "",
            cleaned,
            flags=re.IGNORECASE,
        ).strip()
        patterns = [
            r"(?:latest\s+)?(?:information|info|news|updates)\s+on\s+(.+?)(?=(?:\s+(?:from\s+google|from\s+the\s+web|from\s+web|from\s+the\s+internet|and\s+summarize|and\s+show|and\s+store|and\s+send|and\s+email|email\s+it\s+to|send\s+it\s+to)\b|[.,;]|$))",
            r"(?:latest\s+)?(?:arxiv\s+)?(?:paper|papers)\s+(?:about|on|for)\s+(.+?)(?=(?:\s+(?:and\s+summarize|and\s+show|and\s+store|and\s+send|and\s+email|email\s+it\s+to|send\s+it\s+to)\b|[.,;]|$))",
            r"(?:about|on|for)\s+(.+?)(?=(?:\s+(?:and\s+summarize|and\s+show|and\s+store|and\s+send|and\s+email|email\s+it\s+to|send\s+it\s+to)\b|[.,;]|$))",
            r"fetch\s+(.+?)(?=(?:\s+(?:and\s+summarize|and\s+show|and\s+store|and\s+send|and\s+email|email\s+it\s+to|send\s+it\s+to)\b|[.,;]|$))",
            r"search\s+(.+?)(?=(?:\s+(?:and\s+summarize|and\s+show|and\s+store|and\s+send|and\s+email|email\s+it\s+to|send\s+it\s+to)\b|[.,;]|$))",
        ]
        for pattern in patterns:
            match = re.search(pattern, cleaned, flags=re.IGNORECASE)
            if match:
                return match.group(1).strip(" .\"'")
        fallback = re.sub(r"\s+", " ", cleaned)
        return fallback.strip(" .\"'")
