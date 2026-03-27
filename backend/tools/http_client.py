import requests
from typing import Dict, Any

def http_get(url: str, params: dict = None, headers: dict = None):
    try:
        res = requests.get(url, params=params, headers=headers, timeout=15)
        res.raise_for_status()
        return {"success": True, "status_code": res.status_code, "text": res.text}
    except Exception as e:
        return {"success": False, "error": str(e)}
