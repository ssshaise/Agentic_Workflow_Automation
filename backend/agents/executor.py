try:
    from ..tool_runtime import execute_tool_with_audit
except ImportError:
    from tool_runtime import execute_tool_with_audit


class ExecutorAgent:
    def __init__(self, tool_builder):
        self.tool_builder = tool_builder

    def execute_step(self, step):
        tool = self.tool_builder.get_tool(step.action)
        audited = execute_tool_with_audit(step.action, tool, step.inputs)
        return {"step_id": step.id, "action": step.action, "result": audited["result"], "audit": audited}
