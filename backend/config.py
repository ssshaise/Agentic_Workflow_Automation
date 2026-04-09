import os
import tempfile
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

DEFAULT_STATE_DIR = Path(os.getenv("FLOW_AUTOMATION_STATE_DIR", Path(tempfile.gettempdir()) / "FlowAutomation"))
DEFAULT_STATE_DIR.mkdir(parents=True, exist_ok=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", "backend/storage/vector_db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{(DEFAULT_STATE_DIR / 'flow_automation.db').as_posix()}")
SECRET_ENCRYPTION_KEY = os.getenv("SECRET_ENCRYPTION_KEY", "flow-automation-dev-secret")
IGNORE_BROKEN_PROXY_ENV = os.getenv("IGNORE_BROKEN_PROXY_ENV", "true").lower() in {"1", "true", "yes", "on"}
HTTP_TIMEOUT_SECONDS = int(os.getenv("HTTP_TIMEOUT_SECONDS", 30))
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "resend").lower()
RESEND_CONFIG = {
    "api_key": os.getenv("RESEND_API_KEY"),
    "from_address": os.getenv("RESEND_FROM_EMAIL") or os.getenv("SMTP_FROM_ADDRESS") or os.getenv("SMTP_USER"),
    "from_name": os.getenv("RESEND_FROM_NAME", os.getenv("SMTP_FROM_NAME", "FLOW")),
    "reply_to": os.getenv("RESEND_REPLY_TO"),
    "base_url": os.getenv("RESEND_BASE_URL", "https://api.resend.com"),
}
