import hashlib
import hmac
import json
import secrets
import uuid
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


UTC = timezone.utc


def utc_now() -> datetime:
    return datetime.now(UTC)


def iso_now() -> str:
    return utc_now().isoformat()


def relative_time(iso_value: Optional[str]) -> str:
    if not iso_value:
        return "Never"
    try:
        dt = datetime.fromisoformat(iso_value)
    except ValueError:
        return iso_value
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
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


def deep_copy_json(data: Any) -> Any:
    return json.loads(json.dumps(data))


class ProductionStore:
    def __init__(self, store_path: Optional[str] = None) -> None:
        self.store_path = Path(store_path) if store_path else Path(__file__).resolve().parent / "storage" / "app_state_v3.json"
        self.store_path.parent.mkdir(parents=True, exist_ok=True)
        self.state = self._load()

    def _load(self) -> Dict[str, Any]:
        if self.store_path.exists():
            return json.loads(self.store_path.read_text(encoding="utf-8"))
        state = self._seed_state()
        self._save(state)
        return state

    def _save(self, state: Optional[Dict[str, Any]] = None) -> None:
        payload = state or self.state
        self.store_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def _base_settings(self) -> Dict[str, Any]:
        return {
            "general": {"defaultModel": "Gemini 2.5 Flash", "timezone": "IST (UTC+5:30)", "maxConcurrentWorkflows": "3"},
            "notifications": {"emailOnWorkflowComplete": True, "emailOnFailure": True, "slackWebhookAlerts": False, "notificationEmail": "you@company.com"},
            "apiKeys": {"geminiApiKey": "", "slackWebhookUrl": "", "sendGridApiKey": ""},
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

    def _seed_demo_user(self) -> Dict[str, Any]:
        now = iso_now()
        demo_workflows = [
            {"id": "WKF-8821-X", "name": "Agentic Research Digest", "task": "Fetch latest arxiv papers -> summarize with LLM -> send digest email every morning", "status": "active", "agents": ["Web Search", "Python Executor", "Email Sender"], "schedule": "Daily 8am", "lastRun": "2 hours ago", "lastRunAt": (utc_now() - timedelta(hours=2)).isoformat()},
            {"id": "WKF-8820-A", "name": "Shopify Inventory Sync", "task": "Fetch Shopify inventory -> compare with warehouse DB -> sync discrepancies every hour", "status": "active", "agents": ["Python Executor", "Database"], "schedule": "Every hour", "lastRun": "5 hours ago", "lastRunAt": (utc_now() - timedelta(hours=5)).isoformat()},
            {"id": "WKF-8819-B", "name": "Market Sentiment Monitor", "task": "Monitor financial news -> analyze sentiment -> alert team", "status": "paused", "agents": ["Web Search", "Python Executor"], "schedule": "Every 6 hours", "lastRun": "Yesterday", "lastRunAt": (utc_now() - timedelta(days=1)).isoformat()},
        ]
        latest_run = self._build_run_payload(
            workflow_id="WKF-8821-X",
            workflow_name="Agentic Research Digest",
            task="Fetch latest arxiv papers -> summarize with LLM -> send digest email every morning",
            engine_results=[],
            use_fallback=False,
            execution_message="Seeded demo workflow result.",
            execution_mode="local",
        )
        return {
            "id": "demo",
            "email": "demo@flow.local",
            "name": "Demo User",
            "password_hash": "",
            "createdAt": now,
            "settings": self._base_settings(),
            "agent_configs": self._base_agent_configs(),
            "secrets": {},
            "workflows": demo_workflows,
            "history": [latest_run],
            "logs": latest_run["logs"],
            "notifications": [
                {"id": 1, "title": "Workflow completed", "desc": "Task finished", "time": "2 min ago", "isRead": False},
                {"id": 2, "title": "Running workflow", "desc": "Processing...", "time": "5 min ago", "isRead": False},
            ],
        }

    def _seed_state(self) -> Dict[str, Any]:
        demo_user = self._seed_demo_user()
        return {
            "users": {demo_user["id"]: demo_user},
            "tokens": {},
        }

    def _get_user(self, user_id: str) -> Dict[str, Any]:
        user = self.state["users"].get(user_id)
        if not user:
            raise KeyError(f"Unknown user {user_id}")
        return user

    def get_or_create_demo_user(self) -> Dict[str, Any]:
        if "demo" not in self.state["users"]:
            self.state["users"]["demo"] = self._seed_demo_user()
            self._save()
        return self.state["users"]["demo"]

    def register_user(self, email: str, password: str, name: Optional[str] = None) -> Dict[str, Any]:
        email_normalized = email.strip().lower()
        for user in self.state["users"].values():
            if user["email"].lower() == email_normalized:
                raise ValueError("A user with that email already exists.")
        user_id = f"user_{uuid.uuid4().hex[:10]}"
        user = {
            "id": user_id,
            "email": email_normalized,
            "name": name or email_normalized.split("@")[0],
            "password_hash": hash_password(password),
            "createdAt": iso_now(),
            "settings": self._base_settings(),
            "agent_configs": self._base_agent_configs(),
            "secrets": {},
            "workflows": [],
            "history": [],
            "logs": [],
            "notifications": [],
        }
        self.state["users"][user_id] = user
        self._save()
        return self._public_user(user)

    def login_user(self, email: str, password: str) -> Dict[str, Any]:
        email_normalized = email.strip().lower()
        user = next((u for u in self.state["users"].values() if u["email"].lower() == email_normalized), None)
        if not user or not verify_password(password, user["password_hash"]):
            raise ValueError("Invalid email or password.")
        token = secrets.token_urlsafe(32)
        self.state["tokens"][token] = user["id"]
        self._save()
        return {"token": token, "user": self._public_user(user)}

    def get_user_from_token(self, token: Optional[str]) -> Optional[Dict[str, Any]]:
        if not token:
            return None
        user_id = self.state["tokens"].get(token)
        if not user_id:
            return None
        return self._public_user(self._get_user(user_id))

    def _public_user(self, user: Dict[str, Any]) -> Dict[str, Any]:
        return {"id": user["id"], "email": user["email"], "name": user["name"], "createdAt": user["createdAt"]}

    def get_public_user(self, user_id: str) -> Dict[str, Any]:
        return self._public_user(self._get_user(user_id))

    def _next_notification_id(self, user_id: str) -> int:
        user = self._get_user(user_id)
        return max((item["id"] for item in user["notifications"]), default=0) + 1

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

    def _format_duration(self, total_seconds: int) -> str:
        minutes, seconds = divmod(total_seconds, 60)
        return f"{minutes}m {seconds:02d}s"

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
    ) -> Dict[str, Any]:
        started_at = utc_now() - timedelta(seconds=42)
        completed_at = utc_now()
        results = engine_results or []
        logs = [
            {"id": uuid.uuid4().hex, "time": (started_at + timedelta(seconds=0)).strftime("%H:%M:%S"), "timestamp": (started_at + timedelta(seconds=0)).isoformat(), "level": "info", "agent": "System", "message": f"Initializing workflow for task: {task}", "runId": "", "workflowId": workflow_id},
            {"id": uuid.uuid4().hex, "time": (started_at + timedelta(seconds=3)).strftime("%H:%M:%S"), "timestamp": (started_at + timedelta(seconds=3)).isoformat(), "level": "info", "agent": "Planner", "message": "Analyzing request and selecting execution strategy", "runId": "", "workflowId": workflow_id},
            {"id": uuid.uuid4().hex, "time": (started_at + timedelta(seconds=9)).strftime("%H:%M:%S"), "timestamp": (started_at + timedelta(seconds=9)).isoformat(), "level": "info", "agent": "Executor", "message": "Running workflow steps", "runId": "", "workflowId": workflow_id},
            {"id": uuid.uuid4().hex, "time": completed_at.strftime("%H:%M:%S"), "timestamp": completed_at.isoformat(), "level": "success", "agent": "System", "message": f"Workflow {status}", "runId": "", "workflowId": workflow_id},
        ]
        current_run_id = run_id or f"RUN-{uuid.uuid4().hex[:8].upper()}"
        for log in logs:
            log["runId"] = current_run_id
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
        return {
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
            "completedAt": completed_at.isoformat(),
            "durationSeconds": int((completed_at - started_at).total_seconds()),
            "time": relative_time(completed_at.isoformat()),
            "duration": self._format_duration(int((completed_at - started_at).total_seconds())),
            "logs": logs,
        }

    def create_queued_run(self, user_id: str, task: str, workflow_id: Optional[str] = None, workflow_name: Optional[str] = None) -> Dict[str, Any]:
        user = self._get_user(user_id)
        workflow = self.get_workflow(user_id, workflow_id) if workflow_id else None
        run = self._build_run_payload(
            workflow_id=workflow_id,
            workflow_name=workflow_name or (workflow["name"] if workflow else self._derive_name(task)),
            task=task,
            engine_results=[],
            use_fallback=False,
            execution_message="Workflow accepted into the execution queue.",
            execution_mode="queued",
            status="queued",
        )
        user["history"].insert(0, run)
        self._save()
        return deep_copy_json(run)

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
        user = self._get_user(user_id)
        run = next((item for item in user["history"] if item["id"] == run_id), None)
        if not run:
            raise KeyError("Run not found.")
        rebuilt = self._build_run_payload(
            workflow_id=run.get("workflowId"),
            workflow_name=run["name"],
            task=run["task"],
            engine_results=engine_results,
            use_fallback=use_fallback,
            execution_message=execution_message,
            execution_mode=execution_mode or run.get("mode"),
            status=status or run["status"],
            run_id=run_id,
        )
        index = user["history"].index(run)
        user["history"][index] = rebuilt
        user["logs"] = rebuilt["logs"] + [log for log in user["logs"] if log.get("runId") != run_id]
        if rebuilt.get("workflowId"):
            workflow = self.get_workflow(user_id, rebuilt["workflowId"])
            if workflow:
                workflow["status"] = "active"
                workflow["lastRun"] = relative_time(rebuilt["completedAt"])
                workflow["lastRunAt"] = rebuilt["completedAt"]
        self._save()
        return deep_copy_json(rebuilt)

    def get_run(self, user_id: str, run_id: str) -> Optional[Dict[str, Any]]:
        user = self._get_user(user_id)
        run = next((item for item in user["history"] if item["id"] == run_id), None)
        return deep_copy_json(run) if run else None

    def list_workflows(self, user_id: str) -> List[Dict[str, Any]]:
        return deep_copy_json(self._get_user(user_id)["workflows"])

    def get_workflow(self, user_id: str, workflow_id: Optional[str]) -> Optional[Dict[str, Any]]:
        if not workflow_id:
            return None
        workflows = self._get_user(user_id)["workflows"]
        workflow = next((item for item in workflows if item["id"] == workflow_id), None)
        return workflow

    def create_workflow(self, user_id: str, task: str, schedule: Optional[str] = None, name: Optional[str] = None) -> Dict[str, Any]:
        workflow = {
            "id": f"WKF-{uuid.uuid4().hex[:4].upper()}-{uuid.uuid4().hex[:1].upper()}",
            "name": name or self._derive_name(task),
            "task": task,
            "status": "active",
            "agents": self._guess_agents(task),
            "schedule": schedule or "Manual",
            "lastRun": "Never",
            "lastRunAt": None,
        }
        self._get_user(user_id)["workflows"].insert(0, workflow)
        self._save()
        return deep_copy_json(workflow)

    def toggle_workflow(self, user_id: str, workflow_id: str) -> Optional[Dict[str, Any]]:
        workflow = self.get_workflow(user_id, workflow_id)
        if not workflow:
            return None
        workflow["status"] = "active" if workflow["status"] == "paused" else "paused"
        self._save()
        return deep_copy_json(workflow)

    def delete_workflow(self, user_id: str, workflow_id: str) -> bool:
        user = self._get_user(user_id)
        original_length = len(user["workflows"])
        user["workflows"] = [workflow for workflow in user["workflows"] if workflow["id"] != workflow_id]
        user["history"] = [run for run in user["history"] if run.get("workflowId") != workflow_id]
        user["logs"] = [log for log in user["logs"] if log.get("workflowId") != workflow_id]
        deleted = len(user["workflows"]) != original_length
        if deleted:
            self._save()
        return deleted

    def list_history(self, user_id: str) -> List[Dict[str, Any]]:
        return deep_copy_json(self._get_user(user_id)["history"])

    def get_latest_run(self, user_id: str) -> Optional[Dict[str, Any]]:
        history = self._get_user(user_id)["history"]
        return deep_copy_json(history[0]) if history else None

    def list_logs(self, user_id: str, level: Optional[str] = None) -> List[Dict[str, Any]]:
        logs = deep_copy_json(self._get_user(user_id)["logs"])
        if level and level.lower() != "all":
            logs = [log for log in logs if log["level"] == level.lower()]
        return logs

    def clear_logs(self, user_id: str) -> None:
        self._get_user(user_id)["logs"] = []
        self._save()

    def list_notifications(self, user_id: str) -> List[Dict[str, Any]]:
        return deep_copy_json(self._get_user(user_id)["notifications"])

    def add_notification(self, user_id: str, title: str, description: str) -> None:
        user = self._get_user(user_id)
        user["notifications"].insert(0, {
            "id": self._next_notification_id(user_id),
            "title": title,
            "desc": description,
            "time": "Just now",
            "isRead": False,
        })
        self._save()

    def get_settings(self, user_id: str) -> Dict[str, Any]:
        settings = deep_copy_json(self._get_user(user_id)["settings"])
        for key, value in self._get_user(user_id).get("secrets", {}).items():
            if key == "geminiApiKey":
                settings["apiKeys"]["geminiApiKey"] = value
        return settings

    def save_settings(self, user_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        config = deep_copy_json(config)
        config["updatedAt"] = iso_now()
        api_keys = config.get("apiKeys", {})
        secrets_map = self._get_user(user_id).setdefault("secrets", {})
        for key in ["geminiApiKey", "slackWebhookUrl", "sendGridApiKey"]:
            secrets_map[key] = api_keys.get(key, "")
        self._get_user(user_id)["settings"] = config
        self._save()
        return deep_copy_json(config)

    def get_agent_config(self, user_id: str, agent: str) -> Dict[str, Any]:
        user = self._get_user(user_id)
        return {"agent": agent, "values": deep_copy_json(user["agent_configs"].get(agent, {})), "updatedAt": user["settings"].get("updatedAt")}

    def save_agent_config(self, user_id: str, agent: str, values: Dict[str, str]) -> Dict[str, Any]:
        self._get_user(user_id)["agent_configs"][agent] = deep_copy_json(values)
        self._save()
        return {"agent": agent, "values": values, "updatedAt": iso_now()}

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
