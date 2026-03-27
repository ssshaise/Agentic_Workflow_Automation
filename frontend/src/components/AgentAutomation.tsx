import { useState } from "react";
import { invokeAgentWorkflow } from "../services/agentApi";

export default function AgentAutomation() {
  const [task, setTask] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const run = async () => {
    try {
      setStatus("Running workflow...");
      setError("");
      const res = await invokeAgentWorkflow(task, "user@example.com");
      setStatus("Finished");
      setResult(res);
    } catch (err: any) {
      setStatus("Error");
      setResult(null);
      setError(err.message || "Unknown error");
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow-md max-w-3xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4">Agentic Workflow Runner</h2>
      <textarea
        className="w-full h-28 border rounded p-2 mb-3"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        placeholder="Enter a task, e.g. 'Download a research paper, summarize it, store the summary, and email me the result'"
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded" 
        onClick={run}
      >
        Run
      </button>
      <p className="mt-3">Status: {status}</p>
      {error && <p className="text-red-600">{error}</p>}
      {result && <pre className="bg-gray-100 rounded p-3 mt-3 text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
