import os
from typing import Dict, Any

class FileSystemTool:
    def execute(self, operation: str, path: str, content: str = "") -> Dict[str, Any]:
        try:
            if operation == "read":
                with open(path, "r", encoding="utf-8") as f:
                    return {"success": True, "data": f.read()}
            if operation == "write":
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                return {"success": True}
            if operation == "delete":
                os.remove(path)
                return {"success": True}
            return {"success": False, "error": "Unknown operation"}
        except Exception as ex:
            return {"success": False, "error": str(ex)}
