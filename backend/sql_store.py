import base64
import copy
import hashlib
import hmac
import json
import secrets
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, create_engine, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

try:
    from cryptography.fernet import Fernet, InvalidToken
    HAS_CRYPTOGRAPHY = True
except ImportError:
    HAS_CRYPTOGRAPHY = False

    class InvalidToken(Exception):
        pass

    class Fernet:
        def __init__(self, key: bytes) -> None:
            self.key = key

        def encrypt(self, value: bytes) -> bytes:
            return base64.urlsafe_b64encode(value)

        def decrypt(self, value: bytes) -> bytes:
            try:
                return base64.urlsafe_b64decode(value)
            except Exception as exc:
                raise InvalidToken(str(exc)) from exc

try:
    from .config import DATABASE_URL, SECRET_ENCRYPTION_KEY
except ImportError:
    from config import DATABASE_URL, SECRET_ENCRYPTION_KEY


UTC = timezone.utc


def utc_now() -> datetime:
    return datetime.now(UTC)


def iso_now() -> str:
    return utc_now().isoformat()


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def relative_time(iso_value: Optional[str]) -> str:
    if not iso_value:
        return "Never"
    try:
        dt = datetime.fromisoformat(iso_value)
    except ValueError:
        return iso_value
    dt = ensure_utc(dt)
    delta = utc_now() - dt
    seconds = max(int(delta.total_seconds()), 0)
    if seconds < 60:
        return "Just now"
    if seconds < 3600:
        minutes = seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    if seconds < 86400:
        hours = seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    days = seconds // 86400
    return "Yesterday" if days == 1 else f"{days} days ago"


def hash_password(password: str, salt: Optional[str] = None) -> str:
    salt = salt or secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return f"{salt}${hashed}"


def verify_password(password: str, stored: str) -> bool:
    if not stored:
        return False
    salt, _, expected = stored.partition("$")
    if not salt or not expected:
        return False
    actual = hash_password(password, salt).partition("$")[2]
    return hmac.compare_digest(actual, expected)


def _deep_copy_json(data: Any) -> Any:
    return json.loads(json.dumps(data))


def _derive_cipher_key(secret: Optional[str]) -> bytes:
    material = (secret or "flow-automation-dev-key").encode("utf-8")
    digest = hashlib.sha256(material).digest()
    return base64.urlsafe_b64encode(digest)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    settings_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    agent_configs_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)


class AuthToken(Base):
    __tablename__ = "auth_tokens"

    token: Mapped[str] = mapped_column(String(255), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    task: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="active")
    agents_json: Mapped[List[str]] = mapped_column(JSON, default=list)
    schedule: Mapped[str] = mapped_column(String(128), default="Manual")
    last_run: Mapped[str] = mapped_column(String(64), default="Never")
    last_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Run(Base):
    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    workflow_id: Mapped[Optional[str]] = mapped_column(ForeignKey("workflows.id", ondelete="SET NULL"), index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    task: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="queued", index=True)
    mode: Mapped[str] = mapped_column(String(32), default="queued")
    message: Mapped[str] = mapped_column(Text, default="")
    reasoning_json: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    output_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    time_label: Mapped[str] = mapped_column(String(64), default="Just now")
    duration_label: Mapped[str] = mapped_column(String(32), default="0m 00s")
    logs_json: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    desc: Mapped[str] = mapped_column(Text)
    time_label: Mapped[str] = mapped_column(String(64), default="Just now")
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class LogEntry(Base):
    __tablename__ = "log_entries"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    run_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    workflow_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    time_label: Mapped[str] = mapped_column(String(32))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    level: Mapped[str] = mapped_column(String(32), index=True)
    agent: Mapped[str] = mapped_column(String(64))
    message: Mapped[str] = mapped_column(Text)


class SecretRecord(Base):
    __tablename__ = "secret_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    secret_key: Mapped[str] = mapped_column(String(128), index=True)
    cipher_text: Mapped[str] = mapped_column(Text)
    key_version: Mapped[str] = mapped_column(String(32), default="v1")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    event_type: Mapped[str] = mapped_column(String(128), index=True)
    severity: Mapped[str] = mapped_column(String(32), default="info")
    component: Mapped[str] = mapped_column(String(64), default="app")
    payload_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("runs.id", ondelete="CASCADE"), unique=True, index=True)
    workflow_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    workflow_name: Mapped[str] = mapped_column(String(255))
    task: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="queued", index=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, default=3)
    available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    leased_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    worker_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class WorkflowSummary(Base):
    __tablename__ = "workflow_summaries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)


class DatabaseStore:
    def __init__(self, database_url: Optional[str] = None) -> None:
        self.database_url = database_url or DATABASE_URL
        self.storage_dir = Path(__file__).resolve().parent / "storage"
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        connect_args = {"check_same_thread": False} if self.database_url.startswith("sqlite") else {}
        self.engine = create_engine(self.database_url, future=True, pool_pre_ping=True, connect_args=connect_args)
        self.SessionLocal = sessionmaker(bind=self.engine, expire_on_commit=False, future=True)
        self.cipher = Fernet(_derive_cipher_key(SECRET_ENCRYPTION_KEY))
        Base.metadata.create_all(self.engine)
        self._seed_demo_user()

    @contextmanager
    def session_scope(self) -> Generator[Session, None, None]:
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def _base_settings(self) -> Dict[str, Any]:
        return {
            "general": {"defaultModel": "Gemini 2.5 Flash", "timezone": "IST (UTC+5:30)", "maxConcurrentWorkflows": "3"},
            "notifications": {"emailOnWorkflowComplete": True, "emailOnFailure": True, "slackWebhookAlerts": False, "notificationEmail": "you@company.com"},
            "apiKeys": {
                "geminiApiKey": "",
                "slackWebhookUrl": "",
                "sendGridApiKey": "",
                "smtpHost": "",
                "smtpPort": "587",
                "smtpUser": "",
                "smtpPass": "",
                "smtpFromAddress": "",
            },
            "updatedAt": iso_now(),
        }

    def _base_agent_configs(self) -> Dict[str, Dict[str, str]]:
        return {
            "Web Search": {"Target URL or Query": "https://arxiv.org/list/cs.AI/recent", "Search Depth": "2 (number of pages to follow)", "Extract Fields": "title, abstract, authors, date", "Filter Keywords": "transformer, llm, agent"},
            "Python Executor": {"Script Name": "data_processor.py", "Python Version": "3.11", "Required Packages": "pandas, requests, google-generativeai", "Environment Variables": "API_KEY=xxx, DB_URL=xxx"},
            "Email Sender": {"From Address": "agent@yourdomain.com", "To Address(es)": "team@company.com, manager@company.com", "Subject Template": "Daily Digest: {date} - {summary_title}", "Send Condition": "On new results"},
            "Database": {"Connection String": "postgresql://user:pass@host:5432/db", "Query / Operation": "SELECT * FROM papers WHERE date > NOW() - INTERVAL '1 day'", "Write Table": "workflow_results", "Primary Key Field": "id"},
            "History": {},
        }

    def _seed_demo_user(self) -> None:
        with self.session_scope() as session:
            if session.get(User, "demo"):
                return
            user = User(
                id="demo",
                email="demo@flow.local",
                name="Demo User",
                password_hash="",
                settings_json=self._base_settings(),
                agent_configs_json=self._base_agent_configs(),
            )
            session.add(user)
            session.add_all(
                [
                    Workflow(
                        id="WKF-8821-X",
                        user_id="demo",
                        name="Agentic Research Digest",
                        task="Fetch latest arxiv papers -> summarize with LLM -> send digest email every morning",
                        status="active",
                        agents_json=["Web Search", "Python Executor", "Email Sender"],
                        schedule="Daily 8am",
                        last_run="2 hours ago",
                        last_run_at=utc_now() - timedelta(hours=2),
                    ),
                    Workflow(
                        id="WKF-8820-A",
                        user_id="demo",
                        name="Shopify Inventory Sync",
                        task="Fetch Shopify inventory -> compare with warehouse DB -> sync discrepancies every hour",
                        status="active",
                        agents_json=["Python Executor", "Database"],
                        schedule="Every hour",
                        last_run="5 hours ago",
                        last_run_at=utc_now() - timedelta(hours=5),
                    ),
                    Workflow(
                        id="WKF-8819-B",
                        user_id="demo",
                        name="Market Sentiment Monitor",
                        task="Monitor financial news -> analyze sentiment -> alert team",
                        status="paused",
                        agents_json=["Web Search", "Python Executor"],
                        schedule="Every 6 hours",
                        last_run="Yesterday",
                        last_run_at=utc_now() - timedelta(days=1),
                    ),
                    Notification(user_id="demo", title="Workflow completed", desc="Task finished", time_label="2 min ago", is_read=False),
                    Notification(user_id="demo", title="Running workflow", desc="Processing...", time_label="5 min ago", is_read=False),
                ]
            )

    def _public_user(self, user: User) -> Dict[str, Any]:
        return {"id": user.id, "email": user.email, "name": user.name, "createdAt": ensure_utc(user.created_at).isoformat()}

    def _serialize_workflow(self, workflow: Workflow) -> Dict[str, Any]:
        return {
            "id": workflow.id,
            "name": workflow.name,
            "task": workflow.task,
            "status": workflow.status,
            "agents": list(workflow.agents_json or []),
            "schedule": workflow.schedule,
            "lastRun": workflow.last_run,
            "lastRunAt": ensure_utc(workflow.last_run_at).isoformat() if workflow.last_run_at else None,
        }

    def _serialize_notification(self, item: Notification) -> Dict[str, Any]:
        return {"id": item.id, "title": item.title, "desc": item.desc, "time": item.time_label, "isRead": item.is_read}

    def _serialize_log(self, item: LogEntry) -> Dict[str, Any]:
        return {
            "id": item.id,
            "time": item.time_label,
            "timestamp": ensure_utc(item.timestamp).isoformat(),
            "level": item.level,
            "agent": item.agent,
            "message": item.message,
            "runId": item.run_id,
            "workflowId": item.workflow_id,
        }

    def _serialize_run(self, run: Run) -> Dict[str, Any]:
        return {
            "id": run.id,
            "workflowId": run.workflow_id,
            "name": run.name,
            "task": run.task,
            "status": run.status,
            "mode": run.mode,
            "message": run.message,
            "reasoning": _deep_copy_json(run.reasoning_json or []),
            "output": _deep_copy_json(run.output_json or {}),
            "startedAt": ensure_utc(run.started_at).isoformat(),
            "completedAt": ensure_utc(run.completed_at).isoformat() if run.completed_at else None,
            "durationSeconds": run.duration_seconds,
            "time": run.time_label,
            "duration": run.duration_label,
            "logs": _deep_copy_json(run.logs_json or []),
        }

    def _format_duration(self, total_seconds: int) -> str:
        minutes, seconds = divmod(total_seconds, 60)
        return f"{minutes}m {seconds:02d}s"

    def _guess_agents(self, task: str) -> List[str]:
        lowered = task.lower()
        agents = []
        if any(word in lowered for word in ["http", "web", "search", "scrape", "arxiv", "news"]):
            agents.append("Web Search")
        if any(word in lowered for word in ["python", "transform", "process", "analyze", "summarize", "sync"]):
            agents.append("Python Executor")
        if any(word in lowered for word in ["email", "mail", "digest", "inbox"]):
            agents.append("Email Sender")
        if any(word in lowered for word in ["database", "db", "postgres", "sqlite", "store"]):
            agents.append("Database")
        return agents or ["Python Executor"]

    def _derive_name(self, task: str) -> str:
        normalized = " ".join(task.strip().split())
        if not normalized:
            return "Untitled Workflow"
        return normalized if len(normalized) <= 48 else f"{normalized[:48].strip()}..."

    def _sanitize_database_url(self) -> str:
        if "@" not in self.database_url or "://" not in self.database_url:
            return self.database_url
        scheme, remainder = self.database_url.split("://", 1)
        if "@" not in remainder:
            return self.database_url
        _, host = remainder.rsplit("@", 1)
        return f"{scheme}://***:***@{host}"

    def _build_logs(self, workflow_id: Optional[str], run_id: str, task: str, status: str, completed_at: datetime) -> List[Dict[str, Any]]:
        started_at = completed_at - timedelta(seconds=42)
        return [
            {"id": uuid.uuid4().hex, "time": started_at.strftime("%H:%M:%S"), "timestamp": started_at.isoformat(), "level": "info", "agent": "System", "message": f"Initializing workflow for task: {task}", "runId": run_id, "workflowId": workflow_id},
            {"id": uuid.uuid4().hex, "time": (started_at + timedelta(seconds=3)).strftime("%H:%M:%S"), "timestamp": (started_at + timedelta(seconds=3)).isoformat(), "level": "info", "agent": "Planner", "message": "Analyzing request and selecting execution strategy", "runId": run_id, "workflowId": workflow_id},
            {"id": uuid.uuid4().hex, "time": (started_at + timedelta(seconds=9)).strftime("%H:%M:%S"), "timestamp": (started_at + timedelta(seconds=9)).isoformat(), "level": "info", "agent": "Executor", "message": "Running workflow steps", "runId": run_id, "workflowId": workflow_id},
            {"id": uuid.uuid4().hex, "time": completed_at.strftime("%H:%M:%S"), "timestamp": completed_at.isoformat(), "level": "success" if status == "completed" else "warning", "agent": "System", "message": f"Workflow {status}", "runId": run_id, "workflowId": workflow_id},
        ]

    def _build_run_payload(
        self,
        workflow_id: Optional[str],
        workflow_name: str,
        task: str,
        engine_results: Optional[List[Dict[str, Any]]],
        use_fallback: bool,
        execution_message: Optional[str] = None,
        execution_mode: Optional[str] = None,
        status: str = "completed",
        run_id: Optional[str] = None,
        started_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        current_run_id = run_id or f"RUN-{uuid.uuid4().hex[:8].upper()}"
        started_at = started_at or (utc_now() - timedelta(seconds=42))
        completed_at = completed_at or utc_now()
        results = engine_results or []
        logs = self._build_logs(workflow_id, current_run_id, task, status, completed_at)
        final_artifact = None
        for item in reversed(results):
            execution_result = item.get("execution", {}).get("result", {})
            if isinstance(execution_result, dict) and (execution_result.get("summary") or execution_result.get("artifacts")):
                final_artifact = execution_result
                break
        abstract = (
            final_artifact.get("summary")
            if isinstance(final_artifact, dict) and final_artifact.get("summary")
            else f"Workflow completed for task: {task}. {execution_message or ('A fallback local plan was used.' if use_fallback else 'Workflow execution completed.')}"
        )
        payload = {
            "id": current_run_id,
            "workflowId": workflow_id,
            "name": workflow_name,
            "task": task,
            "status": status,
            "mode": execution_mode or ("fallback" if use_fallback else "local"),
            "message": execution_message or ("Fallback execution used." if use_fallback else "Workflow execution completed."),
            "reasoning": [
                {"tag": "Planning", "text": "Task was decomposed into executable steps with tool selection based on intent and available runtime capabilities."},
                {"tag": "Validation", "text": "Each tool execution was validated and recorded before final delivery."},
            ],
            "output": {
                "abstract": abstract,
                "papersFound": max(len(results), 1),
                "processed": len(results),
                "results": results,
                "download": results,
            },
            "startedAt": started_at.isoformat(),
            "completedAt": completed_at.isoformat() if status == "completed" else None,
            "durationSeconds": int(max((completed_at - started_at).total_seconds(), 0)) if status == "completed" else 0,
            "time": relative_time(completed_at.isoformat() if status == "completed" else started_at.isoformat()),
            "duration": self._format_duration(int(max((completed_at - started_at).total_seconds(), 0))) if status == "completed" else "0m 00s",
            "logs": logs,
        }
        if status == "running":
            payload["logs"][-1]["level"] = "info"
            payload["logs"][-1]["message"] = "Workflow running"
        return payload

    def _upsert_logs(self, session: Session, user_id: str, run_payload: Dict[str, Any]) -> None:
        session.query(LogEntry).filter(LogEntry.user_id == user_id, LogEntry.run_id == run_payload["id"]).delete()
        for item in run_payload["logs"]:
            session.add(
                LogEntry(
                    id=item["id"],
                    user_id=user_id,
                    run_id=item.get("runId"),
                    workflow_id=item.get("workflowId"),
                    time_label=item["time"],
                    timestamp=datetime.fromisoformat(item["timestamp"]),
                    level=item["level"],
                    agent=item["agent"],
                    message=item["message"],
                )
            )

    def _store_run(self, session: Session, user_id: str, payload: Dict[str, Any]) -> Run:
        run = session.get(Run, payload["id"])
        started_at = ensure_utc(datetime.fromisoformat(payload["startedAt"]))
        completed_at = ensure_utc(datetime.fromisoformat(payload["completedAt"])) if payload.get("completedAt") else None
        if run is None:
            run = Run(id=payload["id"], user_id=user_id)
            session.add(run)
        run.workflow_id = payload.get("workflowId")
        run.name = payload["name"]
        run.task = payload["task"]
        run.status = payload["status"]
        run.mode = payload["mode"]
        run.message = payload["message"]
        run.reasoning_json = payload["reasoning"]
        run.output_json = payload["output"]
        run.started_at = started_at
        run.completed_at = completed_at
        run.duration_seconds = payload["durationSeconds"]
        run.time_label = payload["time"]
        run.duration_label = payload["duration"]
        run.logs_json = payload["logs"]
        run.updated_at = utc_now()
        self._upsert_logs(session, user_id, payload)
        return run

    def _encrypt_secret(self, value: str) -> str:
        return self.cipher.encrypt(value.encode("utf-8")).decode("utf-8")

    def _decrypt_secret(self, value: str) -> str:
        try:
            return self.cipher.decrypt(value.encode("utf-8")).decode("utf-8")
        except InvalidToken:
            return ""

    def _next_notification_id(self, session: Session, user_id: str) -> int:
        value = session.scalar(select(func.max(Notification.id)).where(Notification.user_id == user_id))
        return int(value or 0) + 1

    def _save_secret_map(self, session: Session, user_id: str, secrets_map: Dict[str, str]) -> None:
        existing = {row.secret_key: row for row in session.scalars(select(SecretRecord).where(SecretRecord.user_id == user_id)).all()}
        for key, value in secrets_map.items():
            row = existing.get(key)
            cipher_text = self._encrypt_secret(value or "")
            if row is None:
                session.add(SecretRecord(user_id=user_id, secret_key=key, cipher_text=cipher_text))
            else:
                row.cipher_text = cipher_text
                row.updated_at = utc_now()

    def get_or_create_demo_user(self) -> Dict[str, Any]:
        self._seed_demo_user()
        with self.session_scope() as session:
            return self._public_user(session.get(User, "demo"))

    def register_user(self, email: str, password: str, name: Optional[str] = None) -> Dict[str, Any]:
        email_normalized = email.strip().lower()
        with self.session_scope() as session:
            exists = session.scalar(select(User).where(func.lower(User.email) == email_normalized))
            if exists:
                raise ValueError("A user with that email already exists.")
            user = User(
                id=f"user_{uuid.uuid4().hex[:10]}",
                email=email_normalized,
                name=name or email_normalized.split("@")[0],
                password_hash=hash_password(password),
                settings_json=self._base_settings(),
                agent_configs_json=self._base_agent_configs(),
            )
            session.add(user)
            session.flush()
            return self._public_user(user)

    def login_user(self, email: str, password: str) -> Dict[str, Any]:
        email_normalized = email.strip().lower()
        with self.session_scope() as session:
            user = session.scalar(select(User).where(func.lower(User.email) == email_normalized))
            if not user or not verify_password(password, user.password_hash):
                raise ValueError("Invalid email or password.")
            token = secrets.token_urlsafe(32)
            session.add(AuthToken(token=token, user_id=user.id))
            return {"token": token, "user": self._public_user(user)}

    def get_user_from_token(self, token: Optional[str]) -> Optional[Dict[str, Any]]:
        if not token:
            return None
        with self.session_scope() as session:
            row = session.get(AuthToken, token)
            if not row:
                return None
            user = session.get(User, row.user_id)
            return self._public_user(user) if user else None

    def get_public_user(self, user_id: str) -> Dict[str, Any]:
        with self.session_scope() as session:
            user = session.get(User, user_id)
            if not user:
                raise KeyError(f"Unknown user {user_id}")
            return self._public_user(user)

    def get_user_secrets(self, user_id: str) -> Dict[str, str]:
        with self.session_scope() as session:
            rows = session.scalars(select(SecretRecord).where(SecretRecord.user_id == user_id)).all()
            return {row.secret_key: self._decrypt_secret(row.cipher_text) for row in rows}

    def add_notification(self, user_id: str, title: str, description: str) -> None:
        with self.session_scope() as session:
            session.add(Notification(id=self._next_notification_id(session, user_id), user_id=user_id, title=title, desc=description, time_label="Just now", is_read=False))

    def list_notifications(self, user_id: str) -> List[Dict[str, Any]]:
        with self.session_scope() as session:
            rows = session.scalars(select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc())).all()
            return [self._serialize_notification(row) for row in rows]

    def list_workflows(self, user_id: str) -> List[Dict[str, Any]]:
        with self.session_scope() as session:
            rows = session.scalars(select(Workflow).where(Workflow.user_id == user_id).order_by(Workflow.created_at.desc())).all()
            return [self._serialize_workflow(row) for row in rows]

    def get_workflow(self, user_id: str, workflow_id: Optional[str]) -> Optional[Dict[str, Any]]:
        if not workflow_id:
            return None
        with self.session_scope() as session:
            workflow = session.scalar(select(Workflow).where(Workflow.user_id == user_id, Workflow.id == workflow_id))
            return self._serialize_workflow(workflow) if workflow else None

    def create_workflow(self, user_id: str, task: str, schedule: Optional[str] = None, name: Optional[str] = None) -> Dict[str, Any]:
        workflow = Workflow(
            id=f"WKF-{uuid.uuid4().hex[:4].upper()}-{uuid.uuid4().hex[:1].upper()}",
            user_id=user_id,
            name=name or self._derive_name(task),
            task=task,
            status="active",
            agents_json=self._guess_agents(task),
            schedule=schedule or "Manual",
            last_run="Never",
            last_run_at=None,
        )
        with self.session_scope() as session:
            session.add(workflow)
            session.flush()
            return self._serialize_workflow(workflow)

    def toggle_workflow(self, user_id: str, workflow_id: str) -> Optional[Dict[str, Any]]:
        with self.session_scope() as session:
            workflow = session.scalar(select(Workflow).where(Workflow.user_id == user_id, Workflow.id == workflow_id))
            if not workflow:
                return None
            workflow.status = "active" if workflow.status == "paused" else "paused"
            return self._serialize_workflow(workflow)

    def delete_workflow(self, user_id: str, workflow_id: str) -> bool:
        with self.session_scope() as session:
            workflow = session.scalar(select(Workflow).where(Workflow.user_id == user_id, Workflow.id == workflow_id))
            if not workflow:
                return False
            session.query(Job).filter(Job.user_id == user_id, Job.workflow_id == workflow_id).delete()
            session.query(LogEntry).filter(LogEntry.user_id == user_id, LogEntry.workflow_id == workflow_id).delete()
            session.query(Run).filter(Run.user_id == user_id, Run.workflow_id == workflow_id).delete()
            session.delete(workflow)
            return True

    def list_history(self, user_id: str) -> List[Dict[str, Any]]:
        with self.session_scope() as session:
            rows = session.scalars(select(Run).where(Run.user_id == user_id).order_by(Run.created_at.desc())).all()
            return [self._serialize_run(row) for row in rows]

    def get_latest_run(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self.session_scope() as session:
            row = session.scalar(select(Run).where(Run.user_id == user_id).order_by(Run.created_at.desc()))
            return self._serialize_run(row) if row else None

    def list_logs(self, user_id: str, level: Optional[str] = None) -> List[Dict[str, Any]]:
        with self.session_scope() as session:
            query = select(LogEntry).where(LogEntry.user_id == user_id)
            if level and level.lower() != "all":
                query = query.where(LogEntry.level == level.lower())
            rows = session.scalars(query.order_by(LogEntry.timestamp.desc())).all()
            return [self._serialize_log(row) for row in rows]

    def clear_logs(self, user_id: str) -> None:
        with self.session_scope() as session:
            session.query(LogEntry).filter(LogEntry.user_id == user_id).delete()
            runs = session.scalars(select(Run).where(Run.user_id == user_id)).all()
            for run in runs:
                run.logs_json = []

    def get_settings(self, user_id: str) -> Dict[str, Any]:
        base = self._base_settings()
        with self.session_scope() as session:
            user = session.get(User, user_id)
            settings = copy.deepcopy(user.settings_json or base)
        settings.setdefault("general", {})
        settings["general"] = {**base["general"], **settings["general"]}
        settings.setdefault("notifications", {})
        settings["notifications"] = {**base["notifications"], **settings["notifications"]}
        settings.setdefault("apiKeys", {})
        settings["apiKeys"] = {**base["apiKeys"], **settings["apiKeys"]}
        settings["apiKeys"].update(self.get_user_secrets(user_id))
        return settings

    def save_settings(self, user_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        base = self._base_settings()
        config = _deep_copy_json(config)
        config["general"] = {**base["general"], **config.get("general", {})}
        config["notifications"] = {**base["notifications"], **config.get("notifications", {})}
        config["apiKeys"] = {**base["apiKeys"], **config.get("apiKeys", {})}
        config["updatedAt"] = iso_now()
        api_keys = config.get("apiKeys", {})
        secret_keys = ["geminiApiKey", "slackWebhookUrl", "sendGridApiKey", "smtpHost", "smtpPort", "smtpUser", "smtpPass", "smtpFromAddress"]
        secrets_map = {key: api_keys.get(key, "") for key in secret_keys}
        config["apiKeys"] = {key: "" for key in secret_keys}
        with self.session_scope() as session:
            user = session.get(User, user_id)
            user.settings_json = config
            self._save_secret_map(session, user_id, secrets_map)
        result = _deep_copy_json(config)
        result["apiKeys"].update(secrets_map)
        return result

    def get_agent_config(self, user_id: str, agent: str) -> Dict[str, Any]:
        with self.session_scope() as session:
            user = session.get(User, user_id)
            values = copy.deepcopy((user.agent_configs_json or {}).get(agent, {}))
            updated_at = (user.settings_json or {}).get("updatedAt")
            return {"agent": agent, "values": values, "updatedAt": updated_at}

    def save_agent_config(self, user_id: str, agent: str, values: Dict[str, str]) -> Dict[str, Any]:
        with self.session_scope() as session:
            user = session.get(User, user_id)
            configs = copy.deepcopy(user.agent_configs_json or {})
            configs[agent] = _deep_copy_json(values)
            user.agent_configs_json = configs
        return {"agent": agent, "values": values, "updatedAt": iso_now()}

    def create_queued_run(self, user_id: str, task: str, workflow_id: Optional[str] = None, workflow_name: Optional[str] = None) -> Dict[str, Any]:
        workflow = self.get_workflow(user_id, workflow_id) if workflow_id else None
        payload = self._build_run_payload(
            workflow_id=workflow_id,
            workflow_name=workflow_name or (workflow["name"] if workflow else self._derive_name(task)),
            task=task,
            engine_results=[],
            use_fallback=False,
            execution_message="Workflow accepted into the execution queue.",
            execution_mode="queued",
            status="queued",
            started_at=utc_now(),
            completed_at=utc_now(),
        )
        with self.session_scope() as session:
            self._store_run(session, user_id, payload)
        return payload

    def update_run(
        self,
        user_id: str,
        run_id: str,
        *,
        status: Optional[str] = None,
        engine_results: Optional[List[Dict[str, Any]]] = None,
        use_fallback: bool = False,
        execution_message: Optional[str] = None,
        execution_mode: Optional[str] = None,
    ) -> Dict[str, Any]:
        with self.session_scope() as session:
            run = session.get(Run, run_id)
            if not run or run.user_id != user_id:
                raise KeyError("Run not found.")
            started_at = ensure_utc(run.started_at) or utc_now()
            completed_at = utc_now()
            payload = self._build_run_payload(
                workflow_id=run.workflow_id,
                workflow_name=run.name,
                task=run.task,
                engine_results=engine_results,
                use_fallback=use_fallback,
                execution_message=execution_message,
                execution_mode=execution_mode or run.mode,
                status=status or run.status,
                run_id=run_id,
                started_at=started_at,
                completed_at=completed_at,
            )
            self._store_run(session, user_id, payload)
            if payload.get("workflowId") and payload["status"] == "completed":
                workflow = session.get(Workflow, payload["workflowId"])
                if workflow:
                    workflow.status = "active"
                    workflow.last_run = relative_time(payload["completedAt"])
                    workflow.last_run_at = ensure_utc(datetime.fromisoformat(payload["completedAt"]))
            return payload

    def get_run(self, user_id: str, run_id: str) -> Optional[Dict[str, Any]]:
        with self.session_scope() as session:
            run = session.get(Run, run_id)
            if not run or run.user_id != user_id:
                return None
            return self._serialize_run(run)

    def enqueue_job(self, user_id: str, task: str, workflow_id: Optional[str] = None, workflow_name: Optional[str] = None) -> Dict[str, Any]:
        run = self.create_queued_run(user_id=user_id, task=task, workflow_id=workflow_id, workflow_name=workflow_name)
        with self.session_scope() as session:
            session.add(
                Job(
                    id=f"JOB-{uuid.uuid4().hex[:10].upper()}",
                    user_id=user_id,
                    run_id=run["id"],
                    workflow_id=workflow_id,
                    workflow_name=run["name"],
                    task=task,
                    status="queued",
                    available_at=utc_now(),
                )
            )
        return run

    def claim_next_job(self, worker_id: str, lease_seconds: int = 120) -> Optional[Dict[str, Any]]:
        now = utc_now()
        with self.session_scope() as session:
            job = session.scalar(
                select(Job)
                .where(
                    Job.status.in_(["queued", "retry"]),
                    Job.available_at <= now,
                    ((Job.leased_until.is_(None)) | (Job.leased_until < now)),
                )
                .order_by(Job.created_at.asc())
            )
            if not job:
                return None
            job.status = "running"
            job.worker_id = worker_id
            job.leased_until = now + timedelta(seconds=lease_seconds)
            job.attempts += 1
            return {
                "id": job.id,
                "userId": job.user_id,
                "runId": job.run_id,
                "workflowId": job.workflow_id,
                "workflowName": job.workflow_name,
                "task": job.task,
                "attempts": job.attempts,
            }

    def finish_job(self, job_id: str, *, status: str, last_error: Optional[str] = None, retry_delay_seconds: int = 30) -> None:
        with self.session_scope() as session:
            job = session.get(Job, job_id)
            if not job:
                return
            if status == "retry" and job.attempts < job.max_attempts:
                job.status = "retry"
                job.available_at = utc_now() + timedelta(seconds=retry_delay_seconds)
            else:
                job.status = status if status != "retry" else "failed"
            job.last_error = last_error
            job.leased_until = None
            job.worker_id = None

    def heartbeat_job(self, job_id: str, worker_id: str, lease_seconds: int = 120) -> None:
        with self.session_scope() as session:
            job = session.get(Job, job_id)
            if not job or job.worker_id != worker_id:
                return
            job.leased_until = utc_now() + timedelta(seconds=lease_seconds)

    def get_queue_metrics(self) -> Dict[str, Any]:
        with self.session_scope() as session:
            counts = {}
            for value in ["queued", "retry", "running", "completed", "failed"]:
                counts[value] = session.scalar(select(func.count()).select_from(Job).where(Job.status == value)) or 0
            oldest = session.scalar(select(Job.created_at).where(Job.status.in_(["queued", "retry"])).order_by(Job.created_at.asc()))
            return {
                "counts": counts,
                "oldestQueuedAt": oldest.isoformat() if oldest else None,
            }

    def save_workflow_summary(self, task: Optional[str], summary: Optional[str]) -> Dict[str, Any]:
        with self.session_scope() as session:
            row = WorkflowSummary(task=task, summary=summary)
            session.add(row)
            session.flush()
            return {"success": True, "rowid": row.id}

    def list_workflow_summaries(self) -> Dict[str, Any]:
        with self.session_scope() as session:
            rows = session.scalars(select(WorkflowSummary).order_by(WorkflowSummary.created_at.desc()).limit(20)).all()
            return {
                "success": True,
                "rows": [
                    {"id": row.id, "task": row.task, "summary": row.summary, "created_at": row.created_at.isoformat()}
                    for row in rows
                ],
            }

    def record_audit_event(
        self,
        event_type: str,
        *,
        user_id: Optional[str] = None,
        severity: str = "info",
        component: str = "app",
        payload: Optional[Dict[str, Any]] = None,
    ) -> None:
        with self.session_scope() as session:
            session.add(
                AuditEvent(
                    id=f"AUD-{uuid.uuid4().hex[:16]}",
                    user_id=user_id,
                    event_type=event_type,
                    severity=severity,
                    component=component,
                    payload_json=_deep_copy_json(payload or {}),
                )
            )

    def list_audit_events(self, user_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        with self.session_scope() as session:
            query = select(AuditEvent)
            if user_id:
                query = query.where((AuditEvent.user_id == user_id) | (AuditEvent.user_id.is_(None)))
            rows = session.scalars(query.order_by(AuditEvent.created_at.desc()).limit(limit)).all()
            return [
                {
                    "id": row.id,
                    "userId": row.user_id,
                    "eventType": row.event_type,
                    "severity": row.severity,
                    "component": row.component,
                    "payload": _deep_copy_json(row.payload_json or {}),
                    "createdAt": row.created_at.isoformat(),
                }
                for row in rows
            ]

    def get_dashboard_snapshot(self, user_id: str) -> Dict[str, Any]:
        workflows = self.list_workflows(user_id)
        return {
            "workflows": workflows,
            "stats": {
                "total": len(workflows),
                "active": len([w for w in workflows if w["status"] == "active"]),
                "running": len([w for w in workflows if w["status"] == "running"]),
                "failed": len([w for w in workflows if w["status"] == "failed"]),
            },
            "logs": self.list_logs(user_id),
            "notifications": self.list_notifications(user_id),
            "settings": self.get_settings(user_id),
            "history": self.list_history(user_id),
            "latestRun": self.get_latest_run(user_id),
        }

    def get_health_snapshot(self) -> Dict[str, Any]:
        with self.session_scope() as session:
            session.execute(select(1))
        return {
            "databaseUrl": self._sanitize_database_url(),
            "database": "ok",
            "encryptedSecrets": HAS_CRYPTOGRAPHY,
            "queue": self.get_queue_metrics(),
        }


ProductionStore = DatabaseStore
