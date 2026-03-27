import smtplib
from email.message import EmailMessage
from typing import Dict, Any
from config import SMTP_CONFIG

class EmailSender:
    def execute(self, to: str, subject: str, body: str, from_address: str = None) -> Dict[str, Any]:
        from_address = from_address or SMTP_CONFIG.get("user")
        try:
            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = from_address
            msg["To"] = to
            msg.set_content(body)

            with smtplib.SMTP(SMTP_CONFIG["host"], SMTP_CONFIG["port"]) as server:
                server.starttls()
                server.login(SMTP_CONFIG["user"], SMTP_CONFIG["pass"])
                server.send_message(msg)

            return {"success": True}
        except Exception as ex:
            return {"success": False, "error": str(ex)}
