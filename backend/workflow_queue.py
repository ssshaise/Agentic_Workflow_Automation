from concurrent.futures import ThreadPoolExecutor
from typing import Callable, Dict, Optional


class WorkflowQueue:
    def __init__(self, max_workers: int = 2) -> None:
        self.executor = ThreadPoolExecutor(max_workers=max_workers)

    def submit(
        self,
        *,
        user_id: str,
        task: str,
        workflow_id: Optional[str],
        workflow_name: Optional[str],
        store,
        execute_task: Callable[[str, Dict[str, str], Optional[str]], Dict],
        secrets: Dict[str, str],
    ) -> Dict:
        queued_run = store.create_queued_run(user_id=user_id, task=task, workflow_id=workflow_id, workflow_name=workflow_name)

        def worker() -> None:
            store.update_run(user_id, queued_run["id"], status="running", execution_message="Workflow is running in the background.", execution_mode="queued")
            execution = execute_task(task, secrets, store.get_public_user(user_id).get("email"))
            store.update_run(
                user_id,
                queued_run["id"],
                status="completed",
                engine_results=execution["results"],
                use_fallback=execution.get("used_fallback", False),
                execution_message=execution.get("message"),
                execution_mode=execution.get("mode"),
            )

        self.executor.submit(worker)
        return queued_run
