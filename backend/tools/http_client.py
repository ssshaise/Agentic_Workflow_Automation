from typing import Dict, Any

try:
    from ..network import create_retry_session
except ImportError:
    from network import create_retry_session

def http_get(url: str, params: dict = None, headers: dict = None):
    try:
        session = create_retry_session(timeout_seconds=15)
        res = session.get(url, params=params, headers=headers)
        res.raise_for_status()
        return {"success": True, "status_code": res.status_code, "text": res.text}
    except Exception as e:
        return {"success": False, "error": str(e)}
