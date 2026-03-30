import os
from typing import Any, Dict, Optional

import requests
from requests import Session
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

try:
    from .config import HTTP_TIMEOUT_SECONDS, IGNORE_BROKEN_PROXY_ENV
except ImportError:
    from config import HTTP_TIMEOUT_SECONDS, IGNORE_BROKEN_PROXY_ENV


BROKEN_PROXY_SENTINELS = {"http://127.0.0.1:9", "https://127.0.0.1:9"}


def _has_broken_proxy_env() -> bool:
    for key in ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]:
        value = os.getenv(key, "").strip().lower()
        if value in BROKEN_PROXY_SENTINELS:
            return True
    return False


def should_ignore_env_proxies() -> bool:
    return bool(IGNORE_BROKEN_PROXY_ENV or _has_broken_proxy_env())


def create_retry_session(timeout_seconds: Optional[int] = None) -> Session:
    session = requests.Session()
    retry = Retry(
        total=2,
        connect=2,
        read=2,
        backoff_factor=0.6,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=frozenset(["GET", "POST", "PUT", "DELETE", "HEAD"]),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=10)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    if should_ignore_env_proxies():
        session.trust_env = False
        session.proxies = {}
    session.headers.update({"User-Agent": "FlowAutomation/1.0"})
    session.request = _wrap_timeout(session.request, timeout_seconds or HTTP_TIMEOUT_SECONDS)
    return session


def _wrap_timeout(request_fn, timeout_seconds: int):
    def wrapped(method: str, url: str, **kwargs):
        kwargs.setdefault("timeout", timeout_seconds)
        return request_fn(method, url, **kwargs)

    return wrapped


def probe_url(url: str, *, method: str = "GET", headers: Optional[Dict[str, str]] = None, timeout_seconds: int = 5) -> Dict[str, Any]:
    session = create_retry_session(timeout_seconds=timeout_seconds)
    try:
        response = session.request(method.upper(), url, headers=headers or {})
        return {"ok": response.ok, "statusCode": response.status_code}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}
