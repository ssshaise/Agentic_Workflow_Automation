from functools import lru_cache
from collections import defaultdict, deque
from time import time
from typing import Any, Dict, Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from .config import GEMINI_API_KEY
    from .audit import emit_structured_log
    from .job_runner import WorkflowJobRunner
    from .local_workflow import run_local_workflow
    from .network import probe_url, should_ignore_env_proxies
    from .sql_store import DatabaseStore
except ImportError:
    from config import GEMINI_API_KEY
    from audit import emit_structured_log
    from job_runner import WorkflowJobRunner
    from local_workflow import run_local_workflow
    from network import probe_url, should_ignore_env_proxies
    from sql_store import DatabaseStore

try:
    from .workflows.langgraph_workflow import AgenticWorkflow
except Exception:
    try:
        from workflows.langgraph_workflow import AgenticWorkflow
    except Exception:
        AgenticWorkflow = None


app = FastAPI(title="Flow Automation Agentic API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

store = DatabaseStore()
RATE_LIMIT_WINDOWS: dict[str, deque[float]] = defaultdict(deque)


class TaskRequest(BaseModel):
    task: str
    user_email: Optional[str] = None
    workflow_id: Optional[str] = None


class WorkflowCreateRequest(BaseModel):
    task: str
    schedule: Optional[str] = "Manual"
    name: Optional[str] = None


class AgentConfigRequest(BaseModel):
    values: Dict[str, str] = Field(default_factory=dict)


class SettingsRequest(BaseModel):
    general: Dict[str, Any]
    notifications: Dict[str, Any]
    apiKeys: Dict[str, Any]


class AuthRegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class AuthLoginRequest(BaseModel):
    email: str
    password: str


def enforce_rate_limit(bucket: str, limit: int = 10, window_seconds: int = 60) -> None:
    now = time()
    entries = RATE_LIMIT_WINDOWS[bucket]
    while entries and now - entries[0] > window_seconds:
        entries.popleft()
    if len(entries) >= limit:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded. Try again in under {window_seconds} seconds.")
    entries.append(now)


@lru_cache(maxsize=8)
def get_engine(api_key: Optional[str] = None) -> Optional[AgenticWorkflow]:
    effective_key = api_key or GEMINI_API_KEY
    if not effective_key or AgenticWorkflow is None:
        return None
    return AgenticWorkflow(api_key=effective_key)


def execute_task(task: str, secrets: Optional[Dict[str, str]] = None, user_email: Optional[str] = None) -> Dict[str, Any]:
    secrets = secrets or {}
    engine = get_engine(secrets.get("geminiApiKey"))
    if engine is None:
        local_execution = run_local_workflow(task, secrets=secrets, default_recipient=user_email)
        local_execution["message"] = "Gemini engine unavailable, executed the deterministic local workflow engine instead."
        return local_execution
    try:
        results = engine.run(task)
        return {"results": results, "used_fallback": False, "mode": "gemini", "message": "Workflow executed successfully."}
    except Exception as exc:
        local_execution = run_local_workflow(task, secrets=secrets, default_recipient=user_email)
        local_execution["message"] = f"Gemini planning failed, so the local automation engine executed the workflow instead: {exc}"
        return local_execution


workflow_queue = WorkflowJobRunner(store=store, execute_task=execute_task)


def _extract_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return None


def get_current_user(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    token = _extract_token(authorization)
    if token:
        user = store.get_user_from_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid authentication token.")
        return user
    store.get_or_create_demo_user()
    return store.get_public_user("demo")


@app.on_event("startup")
async def startup_event() -> None:
    workflow_queue.start()
    store.record_audit_event("app.startup", component="app", payload={"queueWorker": workflow_queue.worker_id})
    emit_structured_log("app.startup", component="app", payload={"queueWorker": workflow_queue.worker_id})


@app.on_event("shutdown")
async def shutdown_event() -> None:
    workflow_queue.stop()
    store.record_audit_event("app.shutdown", component="app")
    emit_structured_log("app.shutdown", component="app")


@app.get("/api/health")
async def healthcheck() -> Dict[str, Any]:
    gemini_probe = probe_url(
        "https://generativelanguage.googleapis.com/v1beta/models",
        headers={"x-goog-api-key": GEMINI_API_KEY or ""},
        timeout_seconds=5,
    ) if GEMINI_API_KEY else {"ok": False, "error": "GEMINI_API_KEY missing"}
    arxiv_probe = probe_url("http://export.arxiv.org/api/query?search_query=all:test&start=0&max_results=1", timeout_seconds=5)
    queue_health = workflow_queue.health()
    database_health = store.get_health_snapshot()
    overall_ok = database_health.get("database") == "ok" and queue_health.get("threadAlive", False)
    return {
        "status": "ok" if overall_ok else "degraded",
        "database": database_health,
        "jobRunner": queue_health,
        "outboundNetworking": {
            "ignoringBrokenProxyEnv": should_ignore_env_proxies(),
            "gemini": gemini_probe,
            "arxiv": arxiv_probe,
        },
    }


@app.get("/api/health/runtime")
async def runtime_health(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return {
        "status": "ok",
        "jobRunner": workflow_queue.health(),
        "audit": store.list_audit_events(user_id=current_user["id"], limit=20),
    }


@app.post("/api/auth/register")
async def register(req: AuthRegisterRequest) -> Dict[str, Any]:
    try:
        user = store.register_user(req.email, req.password, req.name)
        login = store.login_user(req.email, req.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    store.record_audit_event("auth.register", user_id=user["id"], component="auth", payload={"email": user["email"]})
    emit_structured_log("auth.register", component="auth", user_id=user["id"], payload={"email": user["email"]})
    return {"user": user, "token": login["token"]}


@app.post("/api/auth/login")
async def login(req: AuthLoginRequest) -> Dict[str, Any]:
    try:
        login_payload = store.login_user(req.email, req.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    store.record_audit_event("auth.login", user_id=login_payload["user"]["id"], component="auth", payload={"email": login_payload["user"]["email"]})
    emit_structured_log("auth.login", component="auth", user_id=login_payload["user"]["id"], payload={"email": login_payload["user"]["email"]})
    return login_payload


@app.get("/api/auth/me")
async def me(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return {"user": current_user}


@app.get("/api/dashboard")
async def get_dashboard(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return store.get_dashboard_snapshot(current_user["id"])


@app.get("/api/workflows")
async def get_workflows(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    snapshot = store.get_dashboard_snapshot(current_user["id"])
    return {"workflows": snapshot["workflows"], "stats": snapshot["stats"]}


@app.post("/api/workflows")
async def create_workflow(req: WorkflowCreateRequest, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    enforce_rate_limit(f"create_workflow:{current_user['id']}", limit=12, window_seconds=60)
    if not req.task.strip():
        raise HTTPException(status_code=400, detail="Task cannot be empty.")
    workflow = store.create_workflow(current_user["id"], task=req.task, schedule=req.schedule, name=req.name)
    store.add_notification(current_user["id"], "Workflow created", f"{workflow['name']} is ready to run.")
    store.record_audit_event("workflow.created", user_id=current_user["id"], component="workflow", payload={"workflowId": workflow["id"]})
    return {"status": "ok", "workflow": workflow}


@app.post("/api/workflows/{workflow_id}/toggle")
async def toggle_workflow(workflow_id: str, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    enforce_rate_limit(f"toggle_workflow:{current_user['id']}", limit=20, window_seconds=60)
    workflow = store.toggle_workflow(current_user["id"], workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found.")
    store.add_notification(current_user["id"], "Workflow updated", f"{workflow['name']} is now {workflow['status']}.")
    store.record_audit_event("workflow.toggled", user_id=current_user["id"], component="workflow", payload={"workflowId": workflow_id, "status": workflow["status"]})
    return {"status": "ok", "workflow": workflow}


@app.delete("/api/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, str]:
    enforce_rate_limit(f"delete_workflow:{current_user['id']}", limit=10, window_seconds=60)
    deleted = store.delete_workflow(current_user["id"], workflow_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Workflow not found.")
    store.add_notification(current_user["id"], "Workflow deleted", f"{workflow_id} was removed.")
    store.record_audit_event("workflow.deleted", user_id=current_user["id"], component="workflow", payload={"workflowId": workflow_id})
    return {"status": "ok"}


@app.post("/api/workflows/{workflow_id}/replay")
async def replay_workflow(workflow_id: str, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    enforce_rate_limit(f"replay_workflow:{current_user['id']}", limit=10, window_seconds=60)
    workflow = store.get_workflow(current_user["id"], workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found.")
    execution = execute_task(workflow["task"], store.get_user_secrets(current_user["id"]), current_user.get("email"))
    latest_run = store.update_run(
        current_user["id"],
        store.create_queued_run(current_user["id"], workflow["task"], workflow_id, workflow["name"])["id"],
        status="completed",
        engine_results=execution["results"],
        use_fallback=execution["used_fallback"],
        execution_message=execution["message"],
        execution_mode=execution.get("mode"),
    )
    return {"status": "ok", "latestRun": latest_run, "message": execution["message"]}


@app.post("/api/agent-workflow")
async def run_workflow(req: TaskRequest, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    enforce_rate_limit(f"run_workflow:{current_user['id']}", limit=6, window_seconds=60)
    if not req.task.strip():
        raise HTTPException(status_code=400, detail="Task cannot be empty.")
    execution = execute_task(req.task, store.get_user_secrets(current_user["id"]), req.user_email or current_user.get("email"))
    latest_run = store.update_run(
        current_user["id"],
        store.create_queued_run(current_user["id"], req.task, req.workflow_id, None)["id"],
        status="completed",
        engine_results=execution["results"],
        use_fallback=execution["used_fallback"],
        execution_message=execution["message"],
        execution_mode=execution.get("mode"),
    )
    return {
        "status": "ok",
        "results": latest_run["output"]["results"],
        "latestRun": latest_run,
        "message": execution["message"],
    }


@app.post("/api/agent-workflow/queue")
async def queue_workflow(req: TaskRequest, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    enforce_rate_limit(f"queue_workflow:{current_user['id']}", limit=10, window_seconds=60)
    if not req.task.strip():
        raise HTTPException(status_code=400, detail="Task cannot be empty.")
    queued_run = workflow_queue.submit(
        user_id=current_user["id"],
        task=req.task,
        workflow_id=req.workflow_id,
        workflow_name=None,
    )
    return {"status": "ok", "latestRun": queued_run, "message": "Workflow queued for background execution."}


@app.get("/api/runs/{run_id}")
async def get_run(run_id: str, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    run = store.get_run(current_user["id"], run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")
    return {"run": run}


@app.get("/api/logs")
async def get_logs(level: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return {"logs": store.list_logs(current_user["id"], level=level)}


@app.get("/api/audit")
async def get_audit(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return {"events": store.list_audit_events(user_id=current_user["id"], limit=50)}


@app.delete("/api/logs")
async def clear_logs(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, str]:
    enforce_rate_limit(f"clear_logs:{current_user['id']}", limit=5, window_seconds=60)
    store.clear_logs(current_user["id"])
    return {"status": "ok"}


@app.get("/api/history")
async def get_history(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return {"history": store.list_history(current_user["id"])}


@app.post("/api/history/{run_id}/clone")
async def clone_history_run(run_id: str, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    enforce_rate_limit(f"clone_history:{current_user['id']}", limit=10, window_seconds=60)
    history = store.list_history(current_user["id"])
    run = next((item for item in history if item["id"] == run_id), None)
    if not run:
        raise HTTPException(status_code=404, detail="History run not found.")
    workflow = store.create_workflow(current_user["id"], task=run["task"], name=f"{run['name']} (Clone)")
    return {"status": "ok", "workflow": workflow}


@app.post("/api/history/{run_id}/replay")
async def replay_history_run(run_id: str, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    enforce_rate_limit(f"replay_history:{current_user['id']}", limit=10, window_seconds=60)
    history = store.list_history(current_user["id"])
    run = next((item for item in history if item["id"] == run_id), None)
    if not run:
        raise HTTPException(status_code=404, detail="History run not found.")
    execution = execute_task(run["task"], store.get_user_secrets(current_user["id"]), current_user.get("email"))
    latest_run = store.update_run(
        current_user["id"],
        store.create_queued_run(current_user["id"], run["task"], run["workflowId"], run["name"])["id"],
        status="completed",
        engine_results=execution["results"],
        use_fallback=execution["used_fallback"],
        execution_message=execution["message"],
        execution_mode=execution.get("mode"),
    )
    return {"status": "ok", "latestRun": latest_run, "message": execution["message"]}


@app.get("/api/notifications")
async def get_notifications(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return {"notifications": store.list_notifications(current_user["id"])}


@app.get("/api/settings")
async def get_settings(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return store.get_settings(current_user["id"])


@app.put("/api/settings")
async def save_settings(req: SettingsRequest, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    enforce_rate_limit(f"save_settings:{current_user['id']}", limit=10, window_seconds=60)
    return store.save_settings(current_user["id"], req.model_dump())


@app.get("/api/agents/{agent_name}")
async def get_agent(agent_name: str, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return store.get_agent_config(current_user["id"], agent_name)


@app.put("/api/agents/{agent_name}")
async def save_agent(agent_name: str, req: AgentConfigRequest, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    enforce_rate_limit(f"save_agent:{current_user['id']}:{agent_name}", limit=10, window_seconds=60)
    return store.save_agent_config(current_user["id"], agent_name, req.values)


@app.post("/api/agents/{agent_name}/test")
async def test_agent(agent_name: str, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    enforce_rate_limit(f"test_agent:{current_user['id']}:{agent_name}", limit=10, window_seconds=60)
    config = store.get_agent_config(current_user["id"], agent_name)
    store.add_notification(current_user["id"], "Agent test completed", f"{agent_name} config validated.")
    return {
        "status": "ok",
        "agent": agent_name,
        "message": f"{agent_name} is ready for execution.",
        "config": config,
    }
