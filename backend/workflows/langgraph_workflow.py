from agents.planner import PlannerAgent
from agents.tool_builder import ToolBuilderAgent
from agents.executor import ExecutorAgent
from agents.validator import ValidatorAgent
from agents.monitor import MonitorAgent
from agents.memory import MemoryAgent

class AgenticWorkflow:
    def __init__(self):
        self.planner = PlannerAgent()
        self.tool_builder = ToolBuilderAgent()
        self.executor = ExecutorAgent(self.tool_builder)
        self.validator = ValidatorAgent()
        self.monitor = MonitorAgent()
        self.memory = MemoryAgent()

    def run(self, task_text: str):
        plan = self.planner.breakdown(task_text)
        step_results = []
        for step in plan:
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
