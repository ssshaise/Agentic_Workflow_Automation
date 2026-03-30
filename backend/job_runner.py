import threading
import time
import uuid
from typing import Callable, Dict, Optional

try:
    from .audit import emit_structured_log
except ImportError:
    from audit import emit_structured_log


class WorkflowJobRunner:
    def __init__(
        self,
        *,
        store,
        execute_task: Callable[[str, Dict[str, str]], Dict],
        poll_interval_seconds: int = 2,
        lease_seconds: int = 120,
    ) -> None:
        self.store = store
        self.execute_task = execute_task
        self.poll_interval_seconds = poll_interval_seconds
        self.lease_seconds = lease_seconds
        self.worker_id = f"worker-{uuid.uuid4().hex[:10]}"
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_loop, name="flow-job-runner", daemon=True)
        self._thread.start()
        emit_structured_log("job_runner.started", component="job_runner", payload={"workerId": self.worker_id})

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5)

    def submit(self, *, user_id: str, task: str, workflow_id: Optional[str], workflow_name: Optional[str]) -> Dict:
        queued_run = self.store.enqueue_job(user_id=user_id, task=task, workflow_id=workflow_id, workflow_name=workflow_name)
        self.store.record_audit_event(
            "job.enqueued",
            user_id=user_id,
            component="job_runner",
            payload={"runId": queued_run["id"], "workflowId": workflow_id, "task": task},
        )
        emit_structured_log("job.enqueued", component="job_runner", user_id=user_id, payload={"runId": queued_run["id"]})
        return queued_run

    def health(self) -> Dict[str, object]:
        return {
            "workerId": self.worker_id,
            "threadAlive": bool(self._thread and self._thread.is_alive()),
            "queue": self.store.get_queue_metrics(),
        }

    def _run_loop(self) -> None:
        while not self._stop_event.is_set():
            job = self.store.claim_next_job(self.worker_id, lease_seconds=self.lease_seconds)
            if not job:
                time.sleep(self.poll_interval_seconds)
                continue
            self._process_job(job)

    def _process_job(self, job: Dict[str, object]) -> None:
        user_id = str(job["userId"])
        run_id = str(job["runId"])
        job_id = str(job["id"])
        try:
            self.store.update_run(
                user_id,
                run_id,
                status="running",
                execution_message="Workflow is running in the background.",
                execution_mode="queued",
            )
            secrets = self.store.get_user_secrets(user_id)
            execution = self.execute_task(str(job["task"]), secrets)
            self.store.update_run(
                user_id,
                run_id,
                status="completed",
                engine_results=execution["results"],
                use_fallback=execution.get("used_fallback", False),
                execution_message=execution.get("message"),
                execution_mode=execution.get("mode"),
            )
            self.store.finish_job(job_id, status="completed")
            self.store.record_audit_event(
                "job.completed",
                user_id=user_id,
                component="job_runner",
                payload={"jobId": job_id, "runId": run_id, "mode": execution.get("mode")},
            )
            emit_structured_log("job.completed", component="job_runner", user_id=user_id, payload={"jobId": job_id, "runId": run_id})
        except Exception as exc:
            self.store.update_run(
                user_id,
                run_id,
                status="failed",
                engine_results=[],
                use_fallback=False,
                execution_message=f"Workflow run failed: {exc}",
                execution_mode="queued",
            )
            self.store.finish_job(job_id, status="retry", last_error=str(exc))
            self.store.record_audit_event(
                "job.failed",
                user_id=user_id,
                severity="error",
                component="job_runner",
                payload={"jobId": job_id, "runId": run_id, "error": str(exc)},
            )
            emit_structured_log("job.failed", severity="error", component="job_runner", user_id=user_id, payload={"jobId": job_id, "error": str(exc)})
