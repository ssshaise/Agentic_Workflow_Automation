import json
import re

try:
    from ..agents.planner import PlannerAgent
    from ..agents.tool_builder import ToolBuilderAgent
    from ..agents.executor import ExecutorAgent
    from ..agents.validator import ValidatorAgent
    from ..agents.monitor import MonitorAgent
    from ..agents.memory import MemoryAgent
except ImportError:
    from agents.planner import PlannerAgent
    from agents.tool_builder import ToolBuilderAgent
    from agents.executor import ExecutorAgent
    from agents.validator import ValidatorAgent
    from agents.monitor import MonitorAgent
    from agents.memory import MemoryAgent

class AgenticWorkflow:
    def __init__(self, api_key=None):
        self.planner = PlannerAgent(api_key=api_key)
        self.tool_builder = ToolBuilderAgent()
        self.executor = ExecutorAgent(self.tool_builder)
        self.validator = ValidatorAgent(api_key=api_key)
        self.monitor = MonitorAgent()
        self.memory = MemoryAgent()

    def run(self, task_text: str, execution_context=None):
        execution_context = execution_context or {}
        past_executions = self.memory.query(task_text, n=3)
        memory_snippets = self._extract_memory_snippets(past_executions)
        plan = self.planner.breakdown(task_text, past_executions=memory_snippets)
        step_results = []
        context = {
            "task": task_text,
            "past_executions": memory_snippets,
            "plan": [step.dict() for step in plan],
            "execution_context": execution_context,
        }
        for step in plan:
            if step.action == "summarize_content" and not step.inputs.get("data"):
                previous_result = step_results[-1]["execution"]["result"] if step_results else {"task": task_text}
                step.inputs["data"] = previous_result
            if step.action in {"db_store", "database_query"} and not step.inputs.get("summary"):
                previous_result = step_results[-1]["execution"]["result"] if step_results else {"task": task_text}
                step.inputs["summary"] = str(previous_result)
            if step.action == "database_query" and not step.inputs.get("query"):
                step.inputs["query"] = "save_summary"
            if step.action == "email_sender":
                previous_result = step_results[-1]["execution"]["result"] if step_results else {"task": task_text}
                recipient = step.inputs.get("to")
                if not recipient or recipient == "draft-only":
                    recipient = self._extract_email(task_text) or execution_context.get("default_recipient")
                if recipient:
                    step.inputs["to"] = recipient
                if not step.inputs.get("body") or step.inputs.get("body") == "Workflow completed.":
                    step.inputs["body"] = self._stringify_result(previous_result)
            thought = self._build_thought(step, context)
            exec_out = self.executor.execute_step(step)
            observation = exec_out.get("result")
            validation = self.validator.evaluate(step.dict(), exec_out)
            retries = 0
            while self.monitor.should_retry(validation) and retries < self.monitor.max_retries:
                retries += 1
                exec_out = self.executor.execute_step(step)
                observation = exec_out.get("result")
                validation = self.validator.evaluate(step.dict(), exec_out)
            reflection = self._build_reflection(step, validation, retries)
            step_results.append({
                "step": step.dict(),
                "thought": thought,
                "plan_snapshot": [item.dict() for item in plan],
                "execution": exec_out,
                "observation": observation,
                "reflection": reflection,
                "validation": validation,
                "retries": retries,
            })
            context["last_result"] = observation
        self.memory.save(task_text, [s.dict() for s in plan], step_results)
        return step_results

    def _extract_email(self, task_text):
        match = re.search(r"([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})", task_text, flags=re.IGNORECASE)
        return match.group(1) if match else None

    def _stringify_result(self, value):
        if isinstance(value, str):
            return value
        try:
            return json.dumps(value, indent=2, ensure_ascii=True)
        except TypeError:
            return str(value)

    def _extract_memory_snippets(self, payload):
        if isinstance(payload, list):
            return [item.get("text", "") for item in payload if isinstance(item, dict) and item.get("text")]
        if isinstance(payload, dict):
            documents = payload.get("documents", [])
            if documents and isinstance(documents[0], list):
                return [str(item) for item in documents[0] if item]
            return [str(item) for item in documents if item]
        return []

    def _build_thought(self, step, context):
        if step.action == "web_search":
            return f"Understand the goal and gather external information for task '{context['task']}'."
        if step.action in {"python_exec", "python_executor"}:
            return "Use Python to transform intermediate data or compute the next artifact."
        if step.action in {"db_store", "database_query"}:
            return "Persist or retrieve workflow state so the task can be completed reliably."
        if step.action == "email_sender":
            return "Deliver the completed result to the requested recipient."
        if step.action == "summarize_content":
            return "Condense the gathered information into a usable final output."
        return f"Execute the next planned step: {step.action}."

    def _build_reflection(self, step, validation, retries):
        if validation.get("valid"):
            if retries:
                return f"Step {step.id} succeeded after retrying {retries} time(s). Continue to the next planned action."
            return f"Step {step.id} succeeded. Continue following the full plan."
        return f"Step {step.id} did not validate cleanly: {validation.get('issue', 'Unknown issue')}"
