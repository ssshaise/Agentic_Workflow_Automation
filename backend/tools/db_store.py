import sqlite3
from typing import Dict, Any
import os

class DBStore:
    def __init__(self, path="backend/storage/workflow_data.db"):
        self.path = path
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.path)
        c = conn.cursor()
        c.execute("""
            CREATE TABLE IF NOT EXISTS summaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task TEXT,
                summary TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()

    def execute(self, operation: str, task: str = None, summary: str = None):
        try:
            conn = sqlite3.connect(self.path)
            c = conn.cursor()
            if operation == "save_summary":
                c.execute(
                    "INSERT INTO summaries (task, summary) VALUES (?, ?)",
                    (task, summary),
                )
                conn.commit()
                rowid = c.lastrowid
                conn.close()
                return {"success": True, "rowid": rowid}
            if operation == "get_summaries":
                c.execute("SELECT id, task, summary, created_at FROM summaries ORDER BY created_at DESC LIMIT 20")
                rows = c.fetchall()
                conn.close()
                return {"success": True, "rows": rows}
            conn.close()
            return {"success": False, "error": "Unknown operation"}
        except Exception as ex:
            return {"success": False, "error": str(ex)}
