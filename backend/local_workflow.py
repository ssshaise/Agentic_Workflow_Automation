import re
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
    cleaned = re.sub(
        r"\b(?:and\s+)?(?:email|send)\s+(?:it\s+)?to\s+[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b.*$",
        "",
        task,
        flags=re.IGNORECASE,
    ).strip()
    cleaned = re.sub(
        r"\bfrom\s+(?:google|the\s+web|web|the\s+internet|internet)\b.*$",
        "",
        cleaned,
        flags=re.IGNORECASE,
    ).strip()
    patterns = [
        r"(?:latest\s+)?(?:information|info|news|updates)\s+on\s+(.+?)(?=(?:\s+(?:from\s+google|from\s+the\s+web|from\s+web|from\s+the\s+internet|and\s+summarize|and\s+show|and\s+store|and\s+send|and\s+email|email\s+it\s+to|send\s+it\s+to)\b|[.,;]|$))",
        r"(?:latest\s+)?(?:arxiv\s+)?(?:paper|papers)\s+(?:about|on|for)\s+(.+?)(?=(?:\s+(?:and\s+summarize|and\s+show|and\s+store|and\s+send|and\s+email|email\s+it\s+to|send\s+it\s+to)\b|[.,;]|$))",
        r"(?:about|on|for)\s+(.+?)(?=(?:\s+(?:and\s+summarize|and\s+show|and\s+store|and\s+send|and\s+email|email\s+it\s+to|send\s+it\s+to)\b|[.,;]|$))",
        r"fetch\s+(.+?)(?=(?:\s+(?:and\s+summarize|and\s+show|and\s+store|and\s+send|and\s+email|email\s+it\s+to|send\s+it\s+to)\b|[.,;]|$))",
        r"search\s+(.+?)(?=(?:\s+(?:and\s+summarize|and\s+show|and\s+store|and\s+send|and\s+email|email\s+it\s+to|send\s+it\s+to)\b|[.,;]|$))",
    ]
    for pattern in patterns:
        match = re.search(pattern, cleaned, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip(" .\"'")
    fallback = re.sub(r"\s+", " ", cleaned)
    return fallback.strip(" .\"'")


def _format_digest_body(query: str, search_result: Optional[Dict[str, Any]], summary_result: Optional[Dict[str, Any]]) -> str:
    if isinstance(summary_result, dict) and summary_result.get("summary"):
        bullet_points = summary_result.get("bullet_points") or []
        parts = [summary_result["summary"]]
        if bullet_points:
            parts.append("")
            parts.extend(f"- {point}" for point in bullet_points)
        return "\n".join(parts).strip()
    if isinstance(search_result, dict) and search_result.get("success"):
        papers = search_result.get("papers") or []
        if papers:
            lines = [f"Latest arXiv papers for: {query}", ""]
            for index, paper in enumerate(papers[:5], start=1):
                title = paper.get("title", "Untitled")
                summary = " ".join(str(paper.get("summary", "")).split())
                url = paper.get("url", "")
                lines.append(f"{index}. {title}")
                if summary:
                    lines.append(f"   {summary[:500]}")
                if url:
                    lines.append(f"   {url}")
                lines.append("")
            return "\n".join(lines).strip()
        results = search_result.get("results") or []
        if results:
            lines = [f"Latest web results for: {query}", ""]
            for index, item in enumerate(results[:5], start=1):
                title = item.get("title", "Untitled")
                snippet = " ".join(str(item.get("snippet", "")).split())
                url = item.get("url", "")
                lines.append(f"{index}. {title}")
                if snippet:
                    lines.append(f"   {snippet[:500]}")
                if url:
                    lines.append(f"   {url}")
                lines.append("")
            return "\n".join(lines).strip()
    if isinstance(search_result, dict) and search_result.get("error"):
        return f"FLOW could not fetch arXiv results for {query}.\n\nError: {search_result['error']}"
    return f"FLOW completed the workflow for {query}, but no content was available to include in the email."


def _extract_email(task: str) -> Optional[str]:
    match = re.search(r"([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})", task, flags=re.IGNORECASE)
    return match.group(1) if match else None


def run_local_workflow(task: str, secrets: Optional[Dict[str, str]] = None, default_recipient: Optional[str] = None) -> Dict[str, Any]:
    lowered = task.lower()
    query = _extract_query(task)
    step_results: List[Dict[str, Any]] = []
    artifacts: Dict[str, Any] = {"query": query}
    summary_text = ""

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
            "thought": "Understand the goal, inspect the task text, and produce a full execution plan before acting.",
            "plan_snapshot": [workflow_plan],
            "execution": {"step_id": "step1", "action": "plan_workflow", "result": {"success": True, "plan": workflow_plan}},
            "observation": {"success": True, "plan": workflow_plan},
            "reflection": "The task was decomposed successfully, so execution can proceed step-by-step.",
            "validation": {"valid": True, "issue": ""},
            "retries": 0,
        }
    )

    if workflow_plan["search"]:
        search_result = search_paper(query=query, max_results=5)
        artifacts["search_result"] = search_result
        search_action = "web_search" if search_result.get("source") == "web" else "web_search"
        step_results.append(
            {
                "step": {"id": "step2", "action": search_action, "inputs": {"query": query, "max_results": 5}},
                "thought": "Gather relevant external information before attempting downstream synthesis.",
                "plan_snapshot": [workflow_plan],
                "execution": {"step_id": "step2", "action": search_action, "result": search_result},
                "observation": search_result,
                "reflection": "Use the fetched results as the source of truth for the next step." if search_result.get("success") else "Search failed, so downstream steps should use the captured error details.",
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
                "thought": "Summarize the current working context into a concise artifact.",
                "plan_snapshot": [workflow_plan],
                "execution": {"step_id": "step3", "action": "summarize_content", "result": summary_result},
                "observation": summary_result,
                "reflection": "The summary can now be shown, stored, or emailed depending on the task." if summary_result.get("success") else "The summary step needs fallback handling because it did not complete cleanly.",
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
                "step": {"id": "step4", "action": "database_query", "inputs": {"query": "save_summary"}},
                "thought": "Write the generated artifact to persistent storage.",
                "plan_snapshot": [workflow_plan],
                "execution": {"step_id": "step4", "action": "db_store", "result": db_result},
                "observation": db_result,
                "reflection": "The workflow state has been recorded for future reuse." if db_result.get("success") else "Storage failed, so the final answer should still preserve the artifact in the response.",
                "validation": {"valid": bool(db_result.get("success")), "issue": db_result.get("error", "")},
                "retries": 0,
            }
        )

    if workflow_plan["email"]:
        recipient = _extract_email(task) or default_recipient
        email_body = _format_digest_body(query, artifacts.get("search_result"), artifacts.get("summary_result"))
        if recipient:
            email_result = EmailSender().execute(
                to=recipient,
                subject=f"FLOW Research Digest: {query[:80]}",
                body=email_body,
            )
        else:
            email_result = {
                "success": True,
                "draft": True,
                "message": "No recipient found in the task or your delivery inbox setting. FLOW prepared the email content but did not send it.",
                "body": email_body,
            }
        artifacts["email_result"] = email_result
        step_results.append(
            {
                "step": {"id": "step5", "action": "email_sender", "inputs": {"to": recipient or "draft-only", "body": email_body}},
                "thought": "Deliver the result outward once the artifact is ready.",
                "plan_snapshot": [workflow_plan],
                "execution": {"step_id": "step5", "action": "email_sender", "result": email_result},
                "observation": email_result,
                "reflection": "Delivery completed, or a draft was prepared when no recipient was available." if email_result.get("success") else "Email delivery failed, so the final response should include the prepared content directly.",
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
            "thought": "Package the completed execution trace and final artifact for return.",
            "plan_snapshot": [workflow_plan],
            "execution": {"step_id": "step_final", "action": "deliver_output", "result": final_output},
            "observation": final_output,
            "reflection": "The local workflow completed and produced a final answer payload.",
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
