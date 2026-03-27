import traceback
from typing import Dict, Any

def run_python(code: str, globals_dict: Dict[str, Any] = None, locals_dict: Dict[str, Any] = None):
    globals_dict = globals_dict or {}
    locals_dict = locals_dict or {}
    try:
        exec(code, globals_dict, locals_dict)
        return {"success": True, "result": locals_dict}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}
