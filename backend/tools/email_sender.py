from typing import Any, Dict, Optional

try:
    from ..config import EMAIL_PROVIDER, RESEND_CONFIG
    from ..network import create_retry_session
except ImportError:
    from config import EMAIL_PROVIDER, RESEND_CONFIG
    from network import create_retry_session


class EmailSender:
    def _effective_config(self, overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        config = {
            "provider": EMAIL_PROVIDER,
            "api_key": RESEND_CONFIG.get("api_key"),
            "from_address": RESEND_CONFIG.get("from_address"),
            "from_name": RESEND_CONFIG.get("from_name"),
            "reply_to": RESEND_CONFIG.get("reply_to"),
            "base_url": RESEND_CONFIG.get("base_url"),
        }
        if overrides:
            config.update({key: value for key, value in overrides.items() if value not in (None, "")})
        return config

    def healthcheck(self, smtp_config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        config = self._effective_config(smtp_config)
        if config.get("provider") != "resend":
            return {"ok": False, "stage": "config", "error": f"Unsupported email provider '{config.get('provider')}'."}
        missing = [key for key in ["api_key", "from_address"] if not config.get(key)]
        if missing:
            return {
                "ok": False,
                "stage": "config",
                "provider": "resend",
                "error": f"FLOW email delivery is not configured for Resend. Missing setting(s): {', '.join(missing)}",
            }
        try:
            response = create_retry_session(timeout_seconds=10).get(str(config["base_url"]).rstrip("/"))
            reachable = True
            status_code = response.status_code
        except Exception as exc:
            return {
                "ok": False,
                "stage": "connect",
                "provider": "resend",
                "error": str(exc),
                "baseUrl": config["base_url"],
            }
        return {
            "ok": True,
            "stage": "config",
            "provider": "resend",
            "baseUrl": config["base_url"],
            "reachable": reachable,
            "statusCode": status_code,
            "from": self._format_from_header(config["from_address"], config.get("from_name")),
        }

    def execute(
        self,
        to: str,
        subject: str,
        body: str,
        from_address: Optional[str] = None,
        smtp_config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        config = self._effective_config(smtp_config)
        if config.get("provider") != "resend":
            return {"success": False, "error": f"Unsupported email provider '{config.get('provider')}'."}
        sender_address = from_address or config.get("from_address")
        missing = [key for key, value in {"api_key": config.get("api_key"), "from_address": sender_address}.items() if not value]
        if missing:
            return {
                "success": False,
                "error": f"FLOW email delivery is not configured for Resend. Missing setting(s): {', '.join(missing)}",
            }
        payload: Dict[str, Any] = {
            "from": self._format_from_header(sender_address, config.get("from_name")),
            "to": [to],
            "subject": subject,
            "text": body,
        }
        if config.get("reply_to"):
            payload["reply_to"] = config["reply_to"]
        try:
            session = create_retry_session(timeout_seconds=30)
            response = session.post(
                f"{str(config['base_url']).rstrip('/')}/emails",
                headers={
                    "Authorization": f"Bearer {config['api_key']}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if response.ok:
                data = response.json() if response.content else {}
                return {
                    "success": True,
                    "provider": "resend",
                    "from": payload["from"],
                    "to": to,
                    "emailId": data.get("id"),
                }
            error_detail = self._extract_error(response)
            return {
                "success": False,
                "error": error_detail,
                "provider": "resend",
                "statusCode": response.status_code,
            }
        except Exception as ex:
            return {"success": False, "error": str(ex), "provider": "resend"}

    def _format_from_header(self, from_address: str, from_name: Optional[str]) -> str:
        return f"{from_name} <{from_address}>" if from_name else from_address

    def _extract_error(self, response: Any) -> str:
        try:
            data = response.json()
        except Exception:
            data = {}
        if isinstance(data, dict):
            if data.get("message"):
                return str(data["message"])
            if data.get("error"):
                return str(data["error"])
        if response.status_code == 401:
            return "Resend rejected FLOW's API key."
        if response.status_code == 403:
            return "Resend rejected this sender. Verify the sending domain or sender identity in Resend."
        return f"Resend API error {response.status_code}: {response.text[:300]}"
