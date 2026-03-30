import re
import xml.etree.ElementTree as ET

try:
    from ..network import create_retry_session
except ImportError:
    from network import create_retry_session


def search_paper(query: str, max_results: int = 3):
    try:
        session = create_retry_session(timeout_seconds=20)
        response = session.get(
            "http://export.arxiv.org/api/query",
            params={
                "search_query": f"all:{query}",
                "start": 0,
                "max_results": max_results,
                "sortBy": "submittedDate",
                "sortOrder": "descending",
            },
        )
        response.raise_for_status()
        root = ET.fromstring(response.text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        papers = []
        for entry in root.findall("atom:entry", ns):
            title = (entry.findtext("atom:title", default="", namespaces=ns) or "").strip()
            summary = re.sub(r"\s+", " ", (entry.findtext("atom:summary", default="", namespaces=ns) or "").strip())
            link = ""
            for item in entry.findall("atom:link", ns):
                if item.attrib.get("type") == "application/pdf":
                    link = item.attrib.get("href", "")
                    break
            if not link:
                link = entry.findtext("atom:id", default="", namespaces=ns) or ""
            papers.append(
                {
                    "title": title,
                    "summary": summary,
                    "url": link,
                }
            )
        return {"success": True, "query": query, "papers": papers}
    except Exception as exc:
        return {"success": False, "query": query, "error": str(exc), "papers": []}
