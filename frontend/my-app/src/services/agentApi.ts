export async function invokeAgentWorkflow(task: string, userEmail?: string) {
  const response = await fetch("/api/agent-workflow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, user_email: userEmail }),
  });
  if (!response.ok) {
    throw new Error(`Agent API error ${response.status}`);
  }
  return response.json();
}
