import smtplib
from email.message import EmailMessage
from typing import Dict, Any, Optional
try:
    from ..config import SMTP_CONFIG
except ImportError:
    from config import SMTP_CONFIG


class EmailSender:
    def execute(
        self,
        to: str,
        subject: str,
        body: str,
        from_address: Optional[str] = None,
        smtp_config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        effective_config = {
            "host": SMTP_CONFIG.get("host"),
            "port": SMTP_CONFIG.get("port"),
            "user": SMTP_CONFIG.get("user"),
            "pass": SMTP_CONFIG.get("pass"),
        }
        if smtp_config:
            effective_config.update({key: value for key, value in smtp_config.items() if value not in (None, "")})
        from_address = from_address or effective_config.get("from_address") or effective_config.get("user")
        missing = [key for key in ["host", "port", "user", "pass"] if not effective_config.get(key)]
        if missing:
            return {
                "success": False,
                "error": f"Email sender is not configured. Missing SMTP setting(s): {', '.join(missing)}",
            }
        try:
            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = from_address
            msg["To"] = to
            msg.set_content(body)

            with smtplib.SMTP(effective_config["host"], int(effective_config["port"])) as server:
                server.starttls()
                server.login(effective_config["user"], effective_config["pass"])
                server.send_message(msg)

            return {"success": True}
        except Exception as ex:
            return {"success": False, "error": str(ex)}
