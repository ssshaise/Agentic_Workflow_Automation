import html
import re
import xml.etree.ElementTree as ET
from urllib.parse import parse_qs, quote_plus, unquote, urlparse

try:
    from ..network import create_retry_session
except ImportError:
    from network import create_retry_session


def _is_arxiv_query(query: str) -> bool:
    lowered = query.lower()
    return any(token in lowered for token in ["arxiv", "paper", "papers", "preprint"])


def _search_arxiv(query: str, max_results: int = 3):
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


def _search_web(query: str, max_results: int = 3):
    try:
        session = create_retry_session(timeout_seconds=20)
        url = f"https://www.bing.com/search?q={quote_plus(query)}&setlang=en"
        response = session.get(url)
        response.raise_for_status()
        html_text = response.text
        pattern = re.compile(
            r'<li class="b_algo".*?<h2[^>]*><a[^>]*href="(?P<link>[^"]+)"[^>]*>(?P<title>.*?)</a></h2>.*?'
            r'<div class="b_caption">.*?<p[^>]*>(?P<snippet>.*?)</p>',
            re.S,
        )
        results = []
        for match in pattern.finditer(html_text):
            title = re.sub(r"<.*?>", "", html.unescape(match.group("title"))).strip()
            snippet = re.sub(r"<.*?>", "", html.unescape(match.group("snippet"))).strip()
            link = _decode_bing_url(html.unescape(match.group("link")).strip())
            results.append({"title": title, "snippet": re.sub(r"\s+", " ", snippet), "url": link})
            if len(results) >= max_results:
                break
        return {"success": True, "query": query, "source": "web", "results": results}
    except Exception as exc:
        return {"success": False, "query": query, "source": "web", "error": str(exc), "results": []}


def _decode_bing_url(link: str) -> str:
    parsed = urlparse(link)
    params = parse_qs(parsed.query)
    encoded = params.get("u", [None])[0]
    if not encoded:
        return link
    raw = encoded
    if raw.startswith("a1"):
        raw = raw[2:]
    try:
        import base64

        decoded = base64.b64decode(raw + "=" * (-len(raw) % 4)).decode("utf-8", errors="ignore")
        return decoded if decoded.startswith("http") else unquote(decoded)
    except Exception:
        return unquote(raw)


def search_paper(query: str, max_results: int = 3):
    if _is_arxiv_query(query):
        return _search_arxiv(query, max_results=max_results)
    return _search_web(query, max_results=max_results)
