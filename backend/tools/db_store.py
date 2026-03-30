from typing import Any, Dict

try:
    from ..sql_store import DatabaseStore
except ImportError:
    from sql_store import DatabaseStore


class DBStore:
    def __init__(self):
        self.store = DatabaseStore()

    def execute(self, operation: str, task: str = None, summary: str = None):
        try:
            if operation == "save_summary":
                return self.store.save_workflow_summary(task=task, summary=summary)
            if operation == "get_summaries":
                return self.store.list_workflow_summaries()
            return {"success": False, "error": "Unknown operation"}
        except Exception as ex:
            return {"success": False, "error": str(ex)}
