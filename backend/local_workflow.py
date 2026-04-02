import re
from typing import Any, Dict, List, Optional

try:
    from .tools.db_store import DBStore
    from .tools.email_sender import EmailSender
    from .tools.summarizer import summarize_content
    from .tools.web_search import search_paper
except ImportError:
    from tools.db_store import DBStore
    from tools.email_sender import EmailSender
    from tools.summarizer import summarize_content
    from tools.web_search import search_paper


def _extract_query(task: str) -> str:
    patterns = [
        r"(?:about|on|for)\s+(.+?)(?:\s*(?:->|then|and summarize|and send|and show|$))",
        r"fetch\s+(.+?)(?:\s*(?:->|then|and summarize|and send|and show|$))",
        r"search\s+(.+?)(?:\s*(?:->|then|and summarize|and send|and show|$))",
    ]
    for pattern in patterns:
        match = re.search(pattern, task, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip(" .")
    return task.strip()


def _extract_email(task: str) -> Optional[str]:
    match = re.search(r"([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})", task, flags=re.IGNORECASE)
    return match.group(1) if match else None


def _build_smtp_config(secrets: Optional[Dict[str, str]]) -> Dict[str, Any]:
    secrets = secrets or {}
    port = secrets.get("smtpPort", "")
    return {
        "host": secrets.get("smtpHost", ""),
        "port": int(port) if str(port).strip() else None,
        "user": secrets.get("smtpUser", ""),
        "pass": secrets.get("smtpPass", ""),
        "from_address": secrets.get("smtpFromAddress", ""),
    }


def run_local_workflow(task: str, secrets: Optional[Dict[str, str]] = None, default_recipient: Optional[str] = None) -> Dict[str, Any]:
    lowered = task.lower()
    query = _extract_query(task)
    step_results: List[Dict[str, Any]] = []
    artifacts: Dict[str, Any] = {"query": query}
    summary_text = ""
    smtp_config = _build_smtp_config(secrets)

    workflow_plan = {
        "query": query,
        "search": any(token in lowered for token in ["fetch", "search", "latest", "arxiv", "web"]),
        "summarize": any(token in lowered for token in ["summarize", "summary", "digest", "show output"]),
        "store": any(token in lowered for token in ["store", "save", "database", "db"]),
        "email": any(token in lowered for token in ["email", "mail", "send"]),
    }
    step_results.append(
        {
            "step": {"id": "step1", "action": "plan_workflow", "inputs": {"task": task}},
            "execution": {"step_id": "step1", "action": "plan_workflow", "result": {"success": True, "plan": workflow_plan}},
            "validation": {"valid": True, "issue": ""},
            "retries": 0,
        }
    )

    if workflow_plan["search"]:
        search_result = search_paper(query=query, max_results=5)
        artifacts["search_result"] = search_result
        step_results.append(
            {
                "step": {"id": "step2", "action": "web_search", "inputs": {"query": query, "max_results": 5}},
                "execution": {"step_id": "step2", "action": "web_search", "result": search_result},
                "validation": {"valid": bool(search_result.get("success")), "issue": search_result.get("error", "")},
                "retries": 0,
            }
        )

    if workflow_plan["summarize"]:
        source = artifacts.get("search_result") or {"task": task}
        summary_result = summarize_content(source)
        if isinstance(source, dict) and not source.get("success", True):
            summary_result["summary"] = f"Search step failed, so the workflow completed with captured error details instead of fetched results: {source.get('error', 'Unknown search error')}"
            summary_result["bullet_points"] = [f"Search query: {query}", f"Search error: {source.get('error', 'Unknown error')}"]
        artifacts["summary_result"] = summary_result
        summary_text = summary_result.get("summary", "")
        step_results.append(
            {
                "step": {"id": "step3", "action": "summarize_content", "inputs": {"source": "search_result"}},
                "execution": {"step_id": "step3", "action": "summarize_content", "result": summary_result},
                "validation": {"valid": bool(summary_result.get("success")), "issue": summary_result.get("error", "")},
                "retries": 0,
            }
        )

    if workflow_plan["store"]:
        summary_payload = summary_text or str(artifacts.get("summary_result") or artifacts.get("search_result") or task)
        db_result = DBStore().execute(operation="save_summary", task=task, summary=summary_payload)
        artifacts["db_result"] = db_result
        step_results.append(
            {
                "step": {"id": "step4", "action": "db_store", "inputs": {"operation": "save_summary"}},
                "execution": {"step_id": "step4", "action": "db_store", "result": db_result},
                "validation": {"valid": bool(db_result.get("success")), "issue": db_result.get("error", "")},
                "retries": 0,
            }
        )

    if workflow_plan["email"]:
        recipient = _extract_email(task) or default_recipient
        email_body = summary_text or "Workflow completed."
        if recipient:
            email_result = EmailSender().execute(
                to=recipient,
                subject="Workflow Automation Result",
                body=email_body,
                smtp_config=smtp_config,
            )
        else:
            email_result = {
                "success": True,
                "draft": True,
                "message": "No recipient found in task or user settings. Draft email content prepared instead of sending.",
                "body": email_body,
            }
        artifacts["email_result"] = email_result
        step_results.append(
            {
                "step": {"id": "step5", "action": "email_sender", "inputs": {"to": recipient or "draft-only"}},
                "execution": {"step_id": "step5", "action": "email_sender", "result": email_result},
                "validation": {"valid": bool(email_result.get("success")), "issue": email_result.get("error", "")},
                "retries": 0,
            }
        )

    final_output = {
        "success": True,
        "workflow_plan": workflow_plan,
        "artifacts": artifacts,
        "summary": summary_text or "Workflow executed locally with concrete actions.",
    }
    step_results.append(
        {
            "step": {"id": "step_final", "action": "deliver_output", "inputs": {"task": task}},
            "execution": {"step_id": "step_final", "action": "deliver_output", "result": final_output},
            "validation": {"valid": True, "issue": ""},
            "retries": 0,
        }
    )

    return {
        "results": step_results,
        "mode": "local",
        "used_fallback": False,
        "message": "Executed local deterministic workflow engine.",
    }
