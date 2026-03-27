from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from workflows.langgraph_workflow import AgenticWorkflow

app = FastAPI(title="Flow Automation Agentic API")
engine = AgenticWorkflow()

class TaskRequest(BaseModel):
    task: str
    user_email: str = None

@app.post("/api/agent-workflow")
async def run_workflow(req: TaskRequest):
    try:
        results = engine.run(req.task)
        return {"status": "ok", "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
