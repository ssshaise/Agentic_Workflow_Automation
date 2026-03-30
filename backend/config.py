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
SMTP_CONFIG = {
    "host": os.getenv("SMTP_HOST"),
    "port": int(os.getenv("SMTP_PORT", 587)),
    "user": os.getenv("SMTP_USER"),
    "pass": os.getenv("SMTP_PASS"),
}
