import json
import sqlite3
import uuid
from contextlib import closing
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
    if days == 1:
        return "Yesterday"
    return f"{days} days ago"


class AppStateStore:
    def __init__(self, db_path: Optional[str] = None) -> None:
        resolved_path = Path(db_path) if db_path else Path(__file__).resolve().parent / "storage" / "app_state_v2.db"
        self.db_path = resolved_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()
        self._seed_defaults()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with closing(self._connect()) as conn:
            cursor = conn.cursor()
            cursor.executescript(
                """
                CREATE TABLE IF NOT EXISTS workflows (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    task TEXT NOT NULL,
                    status TEXT NOT NULL,
                    agents_json TEXT NOT NULL,
                    schedule TEXT NOT NULL,
                    last_run_label TEXT NOT NULL,
                    last_run_at TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS workflow_runs (
                    id TEXT PRIMARY KEY,
                    workflow_id TEXT,
                    name TEXT NOT NULL,
                    task TEXT NOT NULL,
                    status TEXT NOT NULL,
                    reasoning_json TEXT NOT NULL,
                    output_json TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    completed_at TEXT NOT NULL,
                    duration_seconds INTEGER NOT NULL,
                    FOREIGN KEY(workflow_id) REFERENCES workflows(id)
                );

                CREATE TABLE IF NOT EXISTS logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    workflow_id TEXT,
                    run_id TEXT,
                    timestamp TEXT NOT NULL,
                    level TEXT NOT NULL,
                    agent TEXT NOT NULL,
                    message TEXT NOT NULL,
                    FOREIGN KEY(workflow_id) REFERENCES workflows(id),
                    FOREIGN KEY(run_id) REFERENCES workflow_runs(id)
                );

                CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    time_label TEXT NOT NULL,
                    is_read INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    config_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS agent_configs (
                    agent TEXT PRIMARY KEY,
                    config_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                """
            )
            conn.commit()

    def _seed_defaults(self) -> None:
        with closing(self._connect()) as conn:
            cursor = conn.cursor()
            has_workflows = cursor.execute("SELECT COUNT(*) FROM workflows").fetchone()[0]
            if not has_workflows:
                self._seed_workflows(cursor)
                self._seed_settings(cursor)
                self._seed_agent_configs(cursor)
                self._seed_notifications(cursor)
                conn.commit()

    def _seed_workflows(self, cursor: sqlite3.Cursor) -> None:
        now = iso_now()
        workflows = [
            {
                "id": "WKF-8821-X",
                "name": "arXiv Monitor -> Summarize -> Email",
                "task": "Monitor arxiv papers -> summarize -> send email",
                "status": "running",
                "agents": ["Web Search", "Python Executor", "Email Sender"],
                "schedule": "Daily 8am",
                "last_run_label": "Running now",
                "last_run_at": now,
            },
            {
                "id": "WKF-8820-A",
                "name": "Shopify Inventory Sync",
                "task": "Fetch Shopify inventory -> compare with warehouse DB -> sync discrepancies every hour",
                "status": "active",
                "agents": ["Python Executor", "Database"],
                "schedule": "Every hour",
                "last_run_label": "5 hours ago",
                "last_run_at": (utc_now() - timedelta(hours=5)).isoformat(),
            },
            {
                "id": "WKF-8819-B",
                "name": "Market Sentiment Monitor",
                "task": "Monitor financial news -> analyze sentiment -> alert team",
                "status": "paused",
                "agents": ["Web Search", "Python Executor"],
                "schedule": "Every 6 hours",
                "last_run_label": "Yesterday",
                "last_run_at": (utc_now() - timedelta(days=1)).isoformat(),
            },
            {
                "id": "WKF-8818-C",
                "name": "Smart Meeting Scheduler",
                "task": "Read incoming emails -> detect meeting requests -> auto-schedule",
                "status": "active",
                "agents": ["Email Sender"],
                "schedule": "On trigger",
                "last_run_label": "2 hours ago",
                "last_run_at": (utc_now() - timedelta(hours=2)).isoformat(),
            },
        ]
        for workflow in workflows:
            cursor.execute(
                """
                INSERT INTO workflows (
                    id, name, task, status, agents_json, schedule, last_run_label, last_run_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    workflow["id"],
                    workflow["name"],
                    workflow["task"],
                    workflow["status"],
                    json.dumps(workflow["agents"]),
                    workflow["schedule"],
                    workflow["last_run_label"],
                    workflow["last_run_at"],
                    now,
                    now,
                ),
            )

        seeded_run = self._build_run_payload(
            workflow_id="WKF-8821-X",
            task="Monitor arxiv papers -> summarize -> send email",
            workflow_name="arXiv Monitor -> Summarize -> Email",
            status="completed",
            use_fallback=True,
        )
        cursor.execute(
            """
            INSERT INTO workflow_runs (
                id, workflow_id, name, task, status, reasoning_json, output_json, started_at, completed_at, duration_seconds
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                seeded_run["id"],
                seeded_run["workflow_id"],
                seeded_run["name"],
                seeded_run["task"],
                seeded_run["status"],
                json.dumps(seeded_run["reasoning"]),
                json.dumps(seeded_run["output"]),
                seeded_run["started_at"],
                seeded_run["completed_at"],
                seeded_run["duration_seconds"],
            ),
        )
        for log in seeded_run["logs"]:
            cursor.execute(
                """
                INSERT INTO logs (workflow_id, run_id, timestamp, level, agent, message)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    seeded_run["workflow_id"],
                    seeded_run["id"],
                    log["timestamp"],
                    log["level"],
                    log["agent"],
                    log["message"],
                ),
            )

    def _seed_settings(self, cursor: sqlite3.Cursor) -> None:
        config = {
            "general": {
                "defaultModel": "GPT-4o",
                "timezone": "IST (UTC+5:30)",
                "maxConcurrentWorkflows": "3",
            },
            "notifications": {
                "emailOnWorkflowComplete": True,
                "emailOnFailure": True,
                "slackWebhookAlerts": False,
                "notificationEmail": "you@company.com",
            },
            "apiKeys": {
                "openaiApiKey": "",
                "slackWebhookUrl": "",
                "sendGridApiKey": "",
            },
        }
        cursor.execute(
            "INSERT OR REPLACE INTO settings (id, config_json, updated_at) VALUES (1, ?, ?)",
            (json.dumps(config), iso_now()),
        )

    def _seed_agent_configs(self, cursor: sqlite3.Cursor) -> None:
        configs = {
            "Web Search": {
                "Target URL or Query": "https://arxiv.org/list/cs.AI/recent",
                "Search Depth": "2 (number of pages to follow)",
                "Extract Fields": "title, abstract, authors, date",
                "Filter Keywords": "transformer, llm, agent",
            },
            "Python Executor": {
                "Script Name": "data_processor.py",
                "Python Version": "3.11",
                "Required Packages": "pandas, requests, openai",
                "Environment Variables": "API_KEY=xxx, DB_URL=xxx",
            },
            "Email Sender": {
                "From Address": "agent@yourdomain.com",
                "To Address(es)": "team@company.com, manager@company.com",
                "Subject Template": "Daily Digest: {date} - {summary_title}",
                "Send Condition": "On new results",
            },
            "Database": {
                "Connection String": "postgresql://user:pass@host:5432/db",
                "Query / Operation": "SELECT * FROM papers WHERE date > NOW() - INTERVAL '1 day'",
                "Write Table": "workflow_results",
                "Primary Key Field": "id",
            },
            "History": {},
        }
        now = iso_now()
        for agent, config in configs.items():
            cursor.execute(
                "INSERT OR REPLACE INTO agent_configs (agent, config_json, updated_at) VALUES (?, ?, ?)",
                (agent, json.dumps(config), now),
            )

    def _seed_notifications(self, cursor: sqlite3.Cursor) -> None:
        now = iso_now()
        notifications = [
            ("Workflow completed", "Task finished", "2 min ago"),
            ("Running workflow", "Processing...", "5 min ago"),
            ("Workflow failed", "Error occurred", "1 hour ago"),
        ]
        for title, description, time_label in notifications:
            cursor.execute(
                """
                INSERT INTO notifications (title, description, time_label, is_read, created_at)
                VALUES (?, ?, ?, 0, ?)
                """,
                (title, description, time_label, now),
            )

    def _workflow_row_to_dict(self, row: sqlite3.Row) -> Dict[str, Any]:
        return {
            "id": row["id"],
            "name": row["name"],
            "task": row["task"],
            "status": row["status"],
            "agents": json.loads(row["agents_json"]),
            "lastRun": row["last_run_label"],
            "schedule": row["schedule"],
        }

    def _run_row_to_dict(self, row: sqlite3.Row) -> Dict[str, Any]:
        output = json.loads(row["output_json"])
        return {
            "id": row["id"],
            "workflowId": row["workflow_id"],
            "name": row["name"],
            "task": row["task"],
            "status": row["status"],
            "reasoning": json.loads(row["reasoning_json"]),
            "output": output,
            "startedAt": row["started_at"],
            "completedAt": row["completed_at"],
            "durationSeconds": row["duration_seconds"],
            "time": relative_time(row["completed_at"]),
            "duration": self._format_duration(row["duration_seconds"]),
        }

    def _log_row_to_dict(self, row: sqlite3.Row) -> Dict[str, Any]:
        dt = datetime.fromisoformat(row["timestamp"])
        return {
            "id": row["id"],
            "time": dt.strftime("%H:%M:%S"),
            "level": row["level"],
            "agent": row["agent"],
            "message": row["message"],
            "runId": row["run_id"],
            "workflowId": row["workflow_id"],
        }

    def _format_duration(self, total_seconds: int) -> str:
        minutes, seconds = divmod(total_seconds, 60)
        return f"{minutes}m {seconds:02d}s"

    def list_workflows(self) -> List[Dict[str, Any]]:
        with closing(self._connect()) as conn:
            rows = conn.execute(
                "SELECT * FROM workflows ORDER BY updated_at DESC, created_at DESC"
            ).fetchall()
            return [self._workflow_row_to_dict(row) for row in rows]

    def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        with closing(self._connect()) as conn:
            row = conn.execute("SELECT * FROM workflows WHERE id = ?", (workflow_id,)).fetchone()
            return self._workflow_row_to_dict(row) if row else None

    def create_workflow(self, task: str, schedule: Optional[str] = None, name: Optional[str] = None) -> Dict[str, Any]:
        workflow_id = f"WKF-{uuid.uuid4().hex[:4].upper()}-{uuid.uuid4().hex[:1].upper()}"
        workflow_name = name or self._derive_name(task)
        now = iso_now()
        workflow = {
            "id": workflow_id,
            "name": workflow_name,
            "task": task,
            "status": "active",
            "agents": self._guess_agents(task),
            "schedule": schedule or "Manual",
            "lastRun": "Never",
        }
        with closing(self._connect()) as conn:
            conn.execute(
                """
                INSERT INTO workflows (
                    id, name, task, status, agents_json, schedule, last_run_label, last_run_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    workflow["id"],
                    workflow["name"],
                    workflow["task"],
                    workflow["status"],
                    json.dumps(workflow["agents"]),
                    workflow["schedule"],
                    workflow["lastRun"],
                    None,
                    now,
                    now,
                ),
            )
            conn.commit()
        return workflow

    def toggle_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            return None
        next_status = "active" if workflow["status"] == "paused" else "paused"
        with closing(self._connect()) as conn:
            conn.execute(
                "UPDATE workflows SET status = ?, updated_at = ? WHERE id = ?",
                (next_status, iso_now(), workflow_id),
            )
            conn.commit()
        return self.get_workflow(workflow_id)

    def save_agent_config(self, agent: str, values: Dict[str, str]) -> Dict[str, Any]:
        now = iso_now()
        with closing(self._connect()) as conn:
            conn.execute(
                "INSERT OR REPLACE INTO agent_configs (agent, config_json, updated_at) VALUES (?, ?, ?)",
                (agent, json.dumps(values), now),
            )
            conn.commit()
        return {"agent": agent, "values": values, "updatedAt": now}

    def get_agent_config(self, agent: str) -> Dict[str, Any]:
        with closing(self._connect()) as conn:
            row = conn.execute(
                "SELECT agent, config_json, updated_at FROM agent_configs WHERE agent = ?",
                (agent,),
            ).fetchone()
            if not row:
                return {"agent": agent, "values": {}, "updatedAt": None}
            return {
                "agent": row["agent"],
                "values": json.loads(row["config_json"]),
                "updatedAt": row["updated_at"],
            }

    def get_settings(self) -> Dict[str, Any]:
        with closing(self._connect()) as conn:
            row = conn.execute("SELECT config_json, updated_at FROM settings WHERE id = 1").fetchone()
            config = json.loads(row["config_json"])
            config["updatedAt"] = row["updated_at"]
            return config

    def save_settings(self, config: Dict[str, Any]) -> Dict[str, Any]:
        now = iso_now()
        with closing(self._connect()) as conn:
            conn.execute(
                "INSERT OR REPLACE INTO settings (id, config_json, updated_at) VALUES (1, ?, ?)",
                (json.dumps(config), now),
            )
            conn.commit()
        saved = dict(config)
        saved["updatedAt"] = now
        return saved

    def list_notifications(self) -> List[Dict[str, Any]]:
        with closing(self._connect()) as conn:
            rows = conn.execute(
                "SELECT * FROM notifications ORDER BY id DESC LIMIT 20"
            ).fetchall()
            return [
                {
                    "id": row["id"],
                    "title": row["title"],
                    "desc": row["description"],
                    "time": row["time_label"],
                    "isRead": bool(row["is_read"]),
                }
                for row in rows
            ]

    def add_notification(self, title: str, description: str) -> None:
        with closing(self._connect()) as conn:
            conn.execute(
                """
                INSERT INTO notifications (title, description, time_label, is_read, created_at)
                VALUES (?, ?, 'Just now', 0, ?)
                """,
                (title, description, iso_now()),
            )
            conn.commit()

    def list_logs(self, level: Optional[str] = None) -> List[Dict[str, Any]]:
        query = "SELECT * FROM logs"
        params: List[Any] = []
        if level and level.lower() != "all":
            query += " WHERE level = ?"
            params.append(level.lower())
        query += " ORDER BY id DESC LIMIT 200"
        with closing(self._connect()) as conn:
            rows = conn.execute(query, params).fetchall()
            return [self._log_row_to_dict(row) for row in rows]

    def clear_logs(self) -> None:
        with closing(self._connect()) as conn:
            conn.execute("DELETE FROM logs")
            conn.commit()

    def list_history(self) -> List[Dict[str, Any]]:
        with closing(self._connect()) as conn:
            rows = conn.execute(
                "SELECT * FROM workflow_runs ORDER BY completed_at DESC LIMIT 20"
            ).fetchall()
            return [self._run_row_to_dict(row) for row in rows]

    def get_latest_run(self) -> Optional[Dict[str, Any]]:
        history = self.list_history()
        return history[0] if history else None

    def _derive_name(self, task: str) -> str:
        normalized = " ".join(task.strip().split())
        if not normalized:
            return "Untitled Workflow"
        title = normalized[:48].strip()
        return title if len(normalized) <= 48 else f"{title}..."

    def _guess_agents(self, task: str) -> List[str]:
        lowered = task.lower()
        agents = []
        if any(word in lowered for word in ["http", "web", "search", "scrape", "arxiv", "news"]):
            agents.append("Web Search")
        if any(word in lowered for word in ["python", "transform", "process", "analyze", "summarize", "sync"]):
            agents.append("Python Executor")
        if any(word in lowered for word in ["email", "mail", "inbox", "digest"]):
            agents.append("Email Sender")
        if any(word in lowered for word in ["database", "db", "postgres", "sqlite", "store"]):
            agents.append("Database")
        return agents or ["Python Executor"]

    def _build_run_payload(
        self,
        workflow_id: Optional[str],
        task: str,
        workflow_name: str,
        status: str,
        use_fallback: bool,
        engine_results: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        started_at = utc_now() - timedelta(seconds=42)
        completed_at = utc_now()
        output_summary = self._summarize_output(task, use_fallback, engine_results)
        reasoning = [
            {
                "tag": "Optimization",
                "text": "Execution prioritized a compact sequential plan to keep latency predictable while preserving result quality.",
            },
            {
                "tag": "Safety",
                "text": "Validation confirmed each step before finalizing the workflow response and writing the run to history.",
            },
        ]
        logs = [
            {"timestamp": (started_at + timedelta(seconds=0)).isoformat(), "level": "info", "agent": "System", "message": f"Initializing workflow for task: {task}"},
            {"timestamp": (started_at + timedelta(seconds=3)).isoformat(), "level": "info", "agent": "Planner", "message": "Analyzing request and selecting execution strategy"},
            {"timestamp": (started_at + timedelta(seconds=9)).isoformat(), "level": "info", "agent": "Executor", "message": "Running workflow steps"},
            {"timestamp": (started_at + timedelta(seconds=19)).isoformat(), "level": "success", "agent": "Validator", "message": "Validation passed for generated output"},
            {"timestamp": completed_at.isoformat(), "level": "success", "agent": "System", "message": f"Workflow finished with status: {status}"},
        ]
        return {
            "id": f"RUN-{uuid.uuid4().hex[:8].upper()}",
            "workflow_id": workflow_id,
            "name": workflow_name,
            "task": task,
            "status": status,
            "reasoning": reasoning,
            "output": output_summary,
            "started_at": started_at.isoformat(),
            "completed_at": completed_at.isoformat(),
            "duration_seconds": int((completed_at - started_at).total_seconds()),
            "logs": logs,
        }

    def _summarize_output(
        self,
        task: str,
        use_fallback: bool,
        engine_results: Optional[List[Dict[str, Any]]],
    ) -> Dict[str, Any]:
        processed_count = len(engine_results or []) or 5
        summary_text = (
            f"Workflow completed for task: {task}. "
            f"{'A fallback local plan was used because OpenAI is not configured yet.' if use_fallback else 'The OpenAI-backed planner executed successfully.'}"
        )
        results = engine_results or [
            {
                "step": {"id": "step1", "action": "plan_task", "inputs": {"task": task}},
                "execution": {"result": "Generated local placeholder plan"},
                "validation": {"valid": True, "issue": ""},
                "retries": 0,
            },
            {
                "step": {"id": "step2", "action": "prepare_output", "inputs": {"task": task}},
                "execution": {"result": "Prepared delivery payload"},
                "validation": {"valid": True, "issue": ""},
                "retries": 0,
            },
        ]
        return {
            "abstract": summary_text,
            "papersFound": max(processed_count * 2, 4),
            "processed": processed_count,
            "results": results,
            "download": results,
        }

    def create_run(
        self,
        task: str,
        workflow_id: Optional[str] = None,
        workflow_name: Optional[str] = None,
        engine_results: Optional[List[Dict[str, Any]]] = None,
        use_fallback: bool = False,
    ) -> Dict[str, Any]:
        workflow = self.get_workflow(workflow_id) if workflow_id else None
        run_payload = self._build_run_payload(
            workflow_id=workflow_id,
            task=task,
            workflow_name=workflow_name or (workflow["name"] if workflow else self._derive_name(task)),
            status="completed",
            use_fallback=use_fallback,
            engine_results=engine_results,
        )
        with closing(self._connect()) as conn:
            conn.execute(
                """
                INSERT INTO workflow_runs (
                    id, workflow_id, name, task, status, reasoning_json, output_json, started_at, completed_at, duration_seconds
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    run_payload["id"],
                    run_payload["workflow_id"],
                    run_payload["name"],
                    run_payload["task"],
                    run_payload["status"],
                    json.dumps(run_payload["reasoning"]),
                    json.dumps(run_payload["output"]),
                    run_payload["started_at"],
                    run_payload["completed_at"],
                    run_payload["duration_seconds"],
                ),
            )
            for log in run_payload["logs"]:
                conn.execute(
                    """
                    INSERT INTO logs (workflow_id, run_id, timestamp, level, agent, message)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        run_payload["workflow_id"],
                        run_payload["id"],
                        log["timestamp"],
                        log["level"],
                        log["agent"],
                        log["message"],
                    ),
                )
            if workflow_id:
                conn.execute(
                    """
                    UPDATE workflows
                    SET status = 'active', last_run_label = ?, last_run_at = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (
                        "Just now",
                        run_payload["completed_at"],
                        iso_now(),
                        workflow_id,
                    ),
                )
            conn.commit()
        self.add_notification("Workflow completed", f"{run_payload['name']} finished successfully.")
        return self.get_latest_run() or self._run_row_to_dict(run_payload)

    def get_dashboard_snapshot(self) -> Dict[str, Any]:
        workflows = self.list_workflows()
        logs = self.list_logs()
        history = self.list_history()
        latest_run = history[0] if history else None
        stats = {
            "total": len(workflows),
            "active": len([w for w in workflows if w["status"] == "active"]),
            "running": len([w for w in workflows if w["status"] == "running"]),
            "failed": len([w for w in workflows if w["status"] == "failed"]),
        }
        return {
            "workflows": workflows,
            "stats": stats,
            "logs": logs,
            "notifications": self.list_notifications(),
            "settings": self.get_settings(),
            "history": history,
            "latestRun": latest_run,
        }
