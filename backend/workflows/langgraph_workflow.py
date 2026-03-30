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

    def run(self, task_text: str):
        plan = self.planner.breakdown(task_text)
        step_results = []
        context = {}
        for step in plan:
            if step.action == "summarize_content" and not step.inputs.get("data"):
                previous_result = step_results[-1]["execution"]["result"] if step_results else {"task": task_text}
                step.inputs["data"] = previous_result
            if step.action == "db_store" and not step.inputs.get("summary"):
                previous_result = step_results[-1]["execution"]["result"] if step_results else {"task": task_text}
                step.inputs["summary"] = str(previous_result)
            if step.action == "email_sender":
                if step.inputs.get("to") == "draft-only":
                    previous_result = step_results[-1]["execution"]["result"] if step_results else {"task": task_text}
                    step.inputs["body"] = str(previous_result)
            exec_out = self.executor.execute_step(step)
            validation = self.validator.evaluate(step.dict(), exec_out)
            retries = 0
            while self.monitor.should_retry(validation) and retries < self.monitor.max_retries:
                retries += 1
                exec_out = self.executor.execute_step(step)
                validation = self.validator.evaluate(step.dict(), exec_out)
            step_results.append({
                "step": step.dict(),
                "execution": exec_out,
                "validation": validation,
                "retries": retries,
            })
        self.memory.save(task_text, [s.dict() for s in plan], step_results)
        return step_results
