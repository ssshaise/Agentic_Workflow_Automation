import requests

def search_paper(query: str, max_results: int = 3):
    return {
        "success": True,
        "papers": [
            {"title": f"Sample paper for {query}", "url": "https://example.com/paper.pdf"},
        ],
    }
