import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional


LOG_DIR = Path(__file__).resolve().parent / "storage"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_PATH = LOG_DIR / "audit.log"


logger = logging.getLogger("flow_audit")
if not logger.handlers:
    logger.setLevel(logging.INFO)
    handler = logging.FileHandler(LOG_PATH, encoding="utf-8")
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)


def emit_structured_log(event_type: str, *, severity: str = "info", component: str = "app", user_id: Optional[str] = None, payload: Optional[Dict[str, Any]] = None) -> None:
    entry = {
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "eventType": event_type,
        "severity": severity,
        "component": component,
        "userId": user_id,
        "payload": payload or {},
    }
    logger.log(_to_level(severity), json.dumps(entry, ensure_ascii=True))


def _to_level(severity: str) -> int:
    return {
        "debug": logging.DEBUG,
        "info": logging.INFO,
        "warning": logging.WARNING,
        "error": logging.ERROR,
        "critical": logging.CRITICAL,
    }.get(severity.lower(), logging.INFO)
