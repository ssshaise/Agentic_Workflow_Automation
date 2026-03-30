import json
from pathlib import Path


class ChromaMemory:
    def __init__(self, path="backend/storage/vector_db"):
        self.path = Path(path)
        self.path.mkdir(parents=True, exist_ok=True)
        self.file_path = self.path / "workflow_history.json"
        if not self.file_path.exists():
            self.file_path.write_text(json.dumps({"documents": []}, indent=2), encoding="utf-8")

    def _read(self):
        return json.loads(self.file_path.read_text(encoding="utf-8"))

    def _write(self, payload):
        self.file_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def add_text(self, text, metadata=None):
        metadata = metadata or {}
        payload = self._read()
        payload["documents"].append({"text": text, "metadata": metadata})
        self._write(payload)

    def query(self, query_text, n_results=3):
        payload = self._read()
        documents = payload.get("documents", [])
        lowered_query = query_text.lower()
        ranked = sorted(
            documents,
            key=lambda item: item["text"].lower().count(lowered_query),
            reverse=True,
        )
        top = ranked[:n_results]
        return {
            "documents": [[item["text"] for item in top]],
            "metadatas": [[item["metadata"] for item in top]],
        }
