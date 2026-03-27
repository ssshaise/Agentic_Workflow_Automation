from chromadb import Client
from chromadb.config import Settings
from config import OPENAI_API_KEY
import os

class ChromaMemory:
    def __init__(self, path="backend/storage/vector_db"):
        os.makedirs(path, exist_ok=True)
        self.client = Client(Settings(chroma_db_impl="duckdb+parquet", persist_directory=path))
        self.collection = self.client.get_or_create_collection("workflow_history")

    def add_text(self, text, metadata=None):
        metadata = metadata or {}
        self.collection.add(
            documents=[text],
            metadatas=[metadata],
            ids=[str(abs(hash(text + str(metadata))))],
        )

    def query(self, query_text, n_results=3):
        return self.collection.query(query_texts=[query_text], n_results=n_results)
