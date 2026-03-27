from typing import Callable
from tools.web_search import search_paper
from tools.python_exec import run_python
from tools.file_system import FileSystemTool
from tools.db_store import DBStore
from tools.email_sender import EmailSender
from tools.http_client import http_get

TOOL_REGISTRY = {
    "web_search": search_paper,
    "python_exec": run_python,
    "file_system": FileSystemTool().execute,
    "db_store": DBStore().execute,
    "email_sender": EmailSender().execute,
    "http_client": http_get,
}

class ToolBuilderAgent:
    def get_tool(self, action_name: str) -> Callable:
        if action_name in TOOL_REGISTRY:
            return TOOL_REGISTRY[action_name]
        raise ValueError(f"Unknown action tool '{action_name}'")
