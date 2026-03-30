import json
from typing import Any, Dict, List


def _coerce_items(data: Any) -> List[str]:
    if isinstance(data, str):
        return [data]
    if isinstance(data, dict):
        if "papers" in data and isinstance(data["papers"], list):
            items = []
            for paper in data["papers"]:
                if isinstance(paper, dict):
                    title = paper.get("title", "Untitled")
                    summary = paper.get("summary") or paper.get("snippet") or ""
                    items.append(f"{title}: {summary}".strip(": "))
            return items
        return [json.dumps(data, ensure_ascii=True)]
    if isinstance(data, list):
        return [json.dumps(item, ensure_ascii=True) if not isinstance(item, str) else item for item in data]
    return [str(data)]


def summarize_content(data: Any, max_items: int = 5) -> Dict[str, Any]:
    items = [item for item in _coerce_items(data) if item][:max_items]
    if not items:
        return {
            "success": True,
            "summary": "No content was available to summarize.",
            "bullet_points": [],
        }

    bullet_points = []
    for item in items:
        cleaned = " ".join(item.split())
        bullet_points.append(cleaned[:220] + ("..." if len(cleaned) > 220 else ""))

    summary = f"Processed {len(items)} workflow artifact(s) and generated a concise summary."
    return {
        "success": True,
        "summary": summary,
        "bullet_points": bullet_points,
    }
