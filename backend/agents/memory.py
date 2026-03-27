from memory.chroma_memory import ChromaMemory

class MemoryAgent:
    def __init__(self):
        self.store = ChromaMemory(path="backend/storage/vector_db")

    def save(self, task, plan, logs):
        doc = f"task: {task}\nplan: {plan}\nlog: {logs}"
        self.store.add_text(doc, metadata={"task": task})

    def query(self, query_text, n=3):
        return self.store.query(query_text, n)
