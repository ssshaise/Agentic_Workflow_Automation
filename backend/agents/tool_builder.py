from typing import Callable
try:
    from ..tools.web_search import search_paper
    from ..tools.python_exec import run_python
    from ..tools.file_system import FileSystemTool
    from ..tools.db_store import DBStore
    from ..tools.email_sender import EmailSender
    from ..tools.http_client import http_get
    from ..tools.summarizer import summarize_content
except ImportError:
    from tools.web_search import search_paper
    from tools.python_exec import run_python
    from tools.file_system import FileSystemTool
    from tools.db_store import DBStore
    from tools.email_sender import EmailSender
    from tools.http_client import http_get
    from tools.summarizer import summarize_content

def _database_query_adapter(query: str, task: str = None, summary: str = None):
    normalized = (query or "").strip().lower()
    store = DBStore()
    if normalized in {"save_summary", "insert_summary", "store_summary"}:
        return store.execute(operation="save_summary", task=task, summary=summary)
    if normalized in {"get_summaries", "list_summaries", "select * from workflow_summaries"}:
        return store.execute(operation="get_summaries")
    return {"success": False, "error": f"Unsupported database query '{query}'"}


TOOL_REGISTRY = {
    "web_search": search_paper,
    "python_exec": run_python,
    "python_executor": run_python,
    "file_system": FileSystemTool().execute,
    "db_store": DBStore().execute,
    "database_query": _database_query_adapter,
    "email_sender": EmailSender().execute,
    "http_client": http_get,
    "summarize_content": summarize_content,
}

class ToolBuilderAgent:
    def get_tool(self, action_name: str) -> Callable:
        if action_name in TOOL_REGISTRY:
            return TOOL_REGISTRY[action_name]
        raise ValueError(f"Unknown action tool '{action_name}'")
