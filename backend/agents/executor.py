class ExecutorAgent:
    def __init__(self, tool_builder):
        self.tool_builder = tool_builder

    def execute_step(self, step):
        tool = self.tool_builder.get_tool(step.action)
        result = tool(**step.inputs)
        return {"step_id": step.id, "action": step.action, "result": result}
