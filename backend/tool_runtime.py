from time import perf_counter, sleep
from typing import Any, Callable, Dict, Optional


TOOL_RETRY_POLICY: Dict[str, int] = {
    "web_search": 2,
    "http_client": 2,
    "email_sender": 1,
    "db_store": 1,
    "summarize_content": 0,
    "python_exec": 0,
    "file_system": 0,
}


def execute_tool_with_audit(action: str, tool: Callable[..., Any], inputs: Dict[str, Any]) -> Dict[str, Any]:
    max_retries = TOOL_RETRY_POLICY.get(action, 0)
    attempts = []
    last_result: Any = None
    success = False
    for attempt in range(max_retries + 1):
        if attempt > 0:
            sleep(min(2 ** (attempt - 1), 4))
        start = perf_counter()
        try:
            result = tool(**inputs)
            duration_ms = round((perf_counter() - start) * 1000, 2)
            attempt_success = _result_success(result)
            attempts.append({"attempt": attempt + 1, "durationMs": duration_ms, "success": attempt_success})
            last_result = result
            success = attempt_success
            if attempt_success:
                break
        except Exception as exc:
            duration_ms = round((perf_counter() - start) * 1000, 2)
            attempts.append({"attempt": attempt + 1, "durationMs": duration_ms, "success": False, "error": str(exc)})
            last_result = {"success": False, "error": str(exc)}
    return {
        "success": success,
        "attempts": attempts,
        "retriesUsed": max(0, len(attempts) - 1),
        "result": last_result,
    }


def _result_success(result: Any) -> bool:
    if isinstance(result, dict) and "success" in result:
        return bool(result["success"])
    return True
