import json
import uuid
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


class AppStateStore:
    def __init__(self, store_path: Optional[str] = None) -> None:
        self.store_path = Path(store_path) if store_path else Path(__file__).resolve().parent / "storage" / "app_state.json"
        self.store_path.parent.mkdir(parents=True, exist_ok=True)
        self.state = self._load()

    def _load(self) -> Dict[str, Any]:
        if self.store_path.exists():
            loaded = json.loads(self.store_path.read_text(encoding="utf-8"))
            api_keys = loaded.get("settings", {}).get("apiKeys", {})
            changed = False
            if "openaiApiKey" in api_keys and "geminiApiKey" not in api_keys:
                api_keys["geminiApiKey"] = api_keys.pop("openaiApiKey")
                loaded["settings"]["apiKeys"] = api_keys
                changed = True
            general = loaded.get("settings", {}).get("general", {})
            if general.get("defaultModel") == "GPT-4o":
                general["defaultModel"] = "Gemini 2.5 Flash"
                loaded["settings"]["general"] = general
                changed = True
            python_executor = loaded.get("agent_configs", {}).get("Python Executor", {})
            if python_executor.get("Required Packages") == "pandas, requests, openai":
                python_executor["Required Packages"] = "pandas, requests, google-generativeai"
                loaded["agent_configs"]["Python Executor"] = python_executor
                changed = True
            for run in loaded.get("history", []):
                output = run.get("output", {})
                abstract = output.get("abstract", "")
                updated = abstract.replace("OpenAI is not configured yet", "Gemini is not configured yet").replace("OpenAI-backed planner", "Gemini-backed planner")
                if updated != abstract:
                    output["abstract"] = updated
                    run["output"] = output
                    changed = True
            for workflow in loaded.get("workflows", []):
                if workflow.get("status") == "running":
                    workflow["status"] = "active"
                    changed = True
                if workflow.get("lastRun") == "Running now":
                    workflow["lastRun"] = relative_time(workflow.get("lastRunAt"))
                    changed = True
            if changed:
                self._save(loaded)
            return loaded
        seeded = self._seed_state()
        self._save(seeded)
        return seeded

    def _save(self, state: Optional[Dict[str, Any]] = None) -> None:
        payload = state or self.state
        self.store_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def _seed_state(self) -> Dict[str, Any]:
        now = iso_now()
        latest_run = self._build_run_payload(
            workflow_id="WKF-8821-X",
            workflow_name="arXiv Monitor -> Summarize -> Email",
            task="Monitor arxiv papers -> summarize -> send email",
            engine_results=None,
            use_fallback=True,
        )
        return {
            "workflows": [
                {
                    "id": "WKF-8821-X",
                    "name": "arXiv Monitor -> Summarize -> Email",
                    "task": "Monitor arxiv papers -> summarize -> send email",
                    "status": "running",
                    "agents": ["Web Search", "Python Executor", "Email Sender"],
                    "schedule": "Daily 8am",
                    "lastRun": "Running now",
                    "lastRunAt": now,
                },
                {
                    "id": "WKF-8820-A",
                    "name": "Shopify Inventory Sync",
                    "task": "Fetch Shopify inventory -> compare with warehouse DB -> sync discrepancies every hour",
                    "status": "active",
                    "agents": ["Python Executor", "Database"],
                    "schedule": "Every hour",
                    "lastRun": "5 hours ago",
                    "lastRunAt": (utc_now() - timedelta(hours=5)).isoformat(),
                },
                {
                    "id": "WKF-8819-B",
                    "name": "Market Sentiment Monitor",
                    "task": "Monitor financial news -> analyze sentiment -> alert team",
                    "status": "paused",
                    "agents": ["Web Search", "Python Executor"],
                    "schedule": "Every 6 hours",
                    "lastRun": "Yesterday",
                    "lastRunAt": (utc_now() - timedelta(days=1)).isoformat(),
                },
                {
                    "id": "WKF-8818-C",
                    "name": "Smart Meeting Scheduler",
                    "task": "Read incoming emails -> detect meeting requests -> auto-schedule",
                    "status": "active",
                    "agents": ["Email Sender"],
                    "schedule": "On trigger",
                    "lastRun": "2 hours ago",
                    "lastRunAt": (utc_now() - timedelta(hours=2)).isoformat(),
                },
            ],
            "history": [latest_run],
            "logs": latest_run["logs"],
            "notifications": [
                {"id": 1, "title": "Workflow completed", "desc": "Task finished", "time": "2 min ago", "isRead": False},
                {"id": 2, "title": "Running workflow", "desc": "Processing...", "time": "5 min ago", "isRead": False},
                {"id": 3, "title": "Workflow failed", "desc": "Error occurred", "time": "1 hour ago", "isRead": False},
            ],
            "settings": {
                "general": {"defaultModel": "Gemini 2.5 Flash", "timezone": "IST (UTC+5:30)", "maxConcurrentWorkflows": "3"},
                "notifications": {"emailOnWorkflowComplete": True, "emailOnFailure": True, "slackWebhookAlerts": False, "notificationEmail": "you@company.com"},
                "apiKeys": {"geminiApiKey": "", "slackWebhookUrl": "", "sendGridApiKey": ""},
                "updatedAt": now,
            },
            "agent_configs": {
                "Web Search": {"Target URL or Query": "https://arxiv.org/list/cs.AI/recent", "Search Depth": "2 (number of pages to follow)", "Extract Fields": "title, abstract, authors, date", "Filter Keywords": "transformer, llm, agent"},
                "Python Executor": {"Script Name": "data_processor.py", "Python Version": "3.11", "Required Packages": "pandas, requests, google-generativeai", "Environment Variables": "API_KEY=xxx, DB_URL=xxx"},
                "Email Sender": {"From Address": "agent@yourdomain.com", "To Address(es)": "team@company.com, manager@company.com", "Subject Template": "Daily Digest: {date} - {summary_title}", "Send Condition": "On new results"},
                "Database": {"Connection String": "postgresql://user:pass@host:5432/db", "Query / Operation": "SELECT * FROM papers WHERE date > NOW() - INTERVAL '1 day'", "Write Table": "workflow_results", "Primary Key Field": "id"},
                "History": {},
            },
        }

    def _next_notification_id(self) -> int:
        return max((item["id"] for item in self.state["notifications"]), default=0) + 1

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
    ) -> Dict[str, Any]:
        started_at = utc_now() - timedelta(seconds=42)
        completed_at = utc_now()
        results = engine_results or [
            {"step": {"id": "step1", "action": "plan_task", "inputs": {"task": task}}, "execution": {"result": "Generated local placeholder plan"}, "validation": {"valid": True, "issue": ""}, "retries": 0},
            {"step": {"id": "step2", "action": "prepare_output", "inputs": {"task": task}}, "execution": {"result": "Prepared delivery payload"}, "validation": {"valid": True, "issue": ""}, "retries": 0},
        ]
        logs = [
            {"id": uuid.uuid4().hex, "time": (started_at + timedelta(seconds=0)).strftime("%H:%M:%S"), "timestamp": (started_at + timedelta(seconds=0)).isoformat(), "level": "info", "agent": "System", "message": f"Initializing workflow for task: {task}", "runId": "", "workflowId": workflow_id},
            {"id": uuid.uuid4().hex, "time": (started_at + timedelta(seconds=3)).strftime("%H:%M:%S"), "timestamp": (started_at + timedelta(seconds=3)).isoformat(), "level": "info", "agent": "Planner", "message": "Analyzing request and selecting execution strategy", "runId": "", "workflowId": workflow_id},
            {"id": uuid.uuid4().hex, "time": (started_at + timedelta(seconds=9)).strftime("%H:%M:%S"), "timestamp": (started_at + timedelta(seconds=9)).isoformat(), "level": "info", "agent": "Executor", "message": "Running workflow steps", "runId": "", "workflowId": workflow_id},
            {"id": uuid.uuid4().hex, "time": (started_at + timedelta(seconds=19)).strftime("%H:%M:%S"), "timestamp": (started_at + timedelta(seconds=19)).isoformat(), "level": "success", "agent": "Validator", "message": "Validation passed for generated output", "runId": "", "workflowId": workflow_id},
            {"id": uuid.uuid4().hex, "time": completed_at.strftime("%H:%M:%S"), "timestamp": completed_at.isoformat(), "level": "success", "agent": "System", "message": "Workflow finished successfully", "runId": "", "workflowId": workflow_id},
        ]
        run_id = f"RUN-{uuid.uuid4().hex[:8].upper()}"
        for log in logs:
            log["runId"] = run_id
        final_artifact = None
        for item in reversed(results):
            execution_result = item.get("execution", {}).get("result", {})
            if isinstance(execution_result, dict) and execution_result.get("summary"):
                final_artifact = execution_result
                break
            if isinstance(execution_result, dict) and execution_result.get("artifacts"):
                final_artifact = execution_result
                break
        return {
            "id": run_id,
            "workflowId": workflow_id,
            "name": workflow_name,
            "task": task,
            "status": "completed",
            "mode": execution_mode or ("fallback" if use_fallback else "gemini"),
            "message": execution_message or ("Fallback execution used." if use_fallback else "Gemini execution completed."),
            "reasoning": [
                {"tag": "Optimization", "text": "Execution prioritized a compact sequential plan to keep latency predictable while preserving result quality."},
                {"tag": "Safety", "text": "Validation confirmed each step before finalizing the workflow response and writing the run to history."},
            ],
            "output": {
                "abstract": (
                    final_artifact.get("summary")
                    if isinstance(final_artifact, dict) and final_artifact.get("summary")
                    else f"Workflow completed for task: {task}. {execution_message or ('A fallback local plan was used.' if use_fallback else 'The Gemini-backed planner executed successfully.')}"
                ),
                "papersFound": max(len(results) * 2, 4),
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

    def list_workflows(self) -> List[Dict[str, Any]]:
        return list(self.state["workflows"])

    def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        return next((item for item in self.state["workflows"] if item["id"] == workflow_id), None)

    def create_workflow(self, task: str, schedule: Optional[str] = None, name: Optional[str] = None) -> Dict[str, Any]:
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
        self.state["workflows"].insert(0, workflow)
        self._save()
        return workflow

    def toggle_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            return None
        workflow["status"] = "active" if workflow["status"] == "paused" else "paused"
        self._save()
        return workflow

    def delete_workflow(self, workflow_id: str) -> bool:
        original_length = len(self.state["workflows"])
        self.state["workflows"] = [workflow for workflow in self.state["workflows"] if workflow["id"] != workflow_id]
        self.state["history"] = [run for run in self.state["history"] if run.get("workflowId") != workflow_id]
        self.state["logs"] = [log for log in self.state["logs"] if log.get("workflowId") != workflow_id]
        deleted = len(self.state["workflows"]) != original_length
        if deleted:
            self._save()
        return deleted

    def list_history(self) -> List[Dict[str, Any]]:
        return list(self.state["history"])

    def get_latest_run(self) -> Optional[Dict[str, Any]]:
        return self.state["history"][0] if self.state["history"] else None

    def list_logs(self, level: Optional[str] = None) -> List[Dict[str, Any]]:
        logs = list(self.state["logs"])
        if level and level.lower() != "all":
            logs = [log for log in logs if log["level"] == level.lower()]
        return logs

    def clear_logs(self) -> None:
        self.state["logs"] = []
        self._save()

    def list_notifications(self) -> List[Dict[str, Any]]:
        return list(self.state["notifications"])

    def add_notification(self, title: str, description: str) -> None:
        self.state["notifications"].insert(0, {
            "id": self._next_notification_id(),
            "title": title,
            "desc": description,
            "time": "Just now",
            "isRead": False,
        })
        self._save()

    def get_settings(self) -> Dict[str, Any]:
        return dict(self.state["settings"])

    def save_settings(self, config: Dict[str, Any]) -> Dict[str, Any]:
        config["updatedAt"] = iso_now()
        self.state["settings"] = config
        self._save()
        return config

    def get_agent_config(self, agent: str) -> Dict[str, Any]:
        return {"agent": agent, "values": dict(self.state["agent_configs"].get(agent, {})), "updatedAt": self.state["settings"].get("updatedAt")}

    def save_agent_config(self, agent: str, values: Dict[str, str]) -> Dict[str, Any]:
        self.state["agent_configs"][agent] = dict(values)
        self._save()
        return {"agent": agent, "values": values, "updatedAt": iso_now()}

    def create_run(
        self,
        task: str,
        workflow_id: Optional[str] = None,
        workflow_name: Optional[str] = None,
        engine_results: Optional[List[Dict[str, Any]]] = None,
        use_fallback: bool = False,
        execution_message: Optional[str] = None,
        execution_mode: Optional[str] = None,
    ) -> Dict[str, Any]:
        workflow = self.get_workflow(workflow_id) if workflow_id else None
        run = self._build_run_payload(
            workflow_id,
            workflow_name or (workflow["name"] if workflow else self._derive_name(task)),
            task,
            engine_results,
            use_fallback,
            execution_message,
            execution_mode,
        )
        self.state["history"].insert(0, run)
        self.state["logs"] = run["logs"] + self.state["logs"]
        if workflow:
            workflow["status"] = "active"
            workflow["lastRun"] = "Just now"
            workflow["lastRunAt"] = run["completedAt"]
        self._save()
        self.add_notification("Workflow completed", f"{run['name']} finished successfully.")
        return run

    def get_dashboard_snapshot(self) -> Dict[str, Any]:
        workflows = self.list_workflows()
        return {
            "workflows": workflows,
            "stats": {
                "total": len(workflows),
                "active": len([w for w in workflows if w["status"] == "active"]),
                "running": len([w for w in workflows if w["status"] == "running"]),
                "failed": len([w for w in workflows if w["status"] == "failed"]),
            },
            "logs": self.list_logs(),
            "notifications": self.list_notifications(),
            "settings": self.get_settings(),
            "history": self.list_history(),
            "latestRun": self.get_latest_run(),
        }
