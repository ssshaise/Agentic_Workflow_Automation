export type WorkflowStatus = "running" | "active" | "paused" | "failed" | "completed"

export interface WorkflowItem {
  id: string
  name: string
  task: string
  status: WorkflowStatus
  agents: string[]
  lastRun: string
  schedule: string
}

export interface WorkflowStats {
  total: number
  active: number
  running: number
  failed: number
}

export interface LogItem {
  id: number
  time: string
  level: string
  agent: string
  message: string
  runId?: string | null
  workflowId?: string | null
}

export interface NotificationItem {
  id: number
  title: string
  desc: string
  time: string
  isRead: boolean
}

export interface LatestRun {
  id: string
  workflowId?: string | null
  name: string
  task: string
  status: string
  mode?: string
  message?: string
  reasoning: { tag: string; text: string }[]
  output: {
    abstract: string
    papersFound: number
    processed: number
    results: unknown[]
    download: unknown
  }
  startedAt: string
  completedAt: string
  durationSeconds: number
  time: string
  duration: string
}

export interface DashboardSettings {
  general: {
    defaultModel: string
    timezone: string
    maxConcurrentWorkflows: string
  }
  notifications: {
    emailOnWorkflowComplete: boolean
    emailOnFailure: boolean
    slackWebhookAlerts: boolean
    notificationEmail: string
  }
  apiKeys: {
    geminiApiKey: string
    slackWebhookUrl: string
    sendGridApiKey: string
    smtpHost: string
    smtpPort: string
    smtpUser: string
    smtpPass: string
    smtpFromAddress: string
  }
  updatedAt?: string
}

export interface AgentConfig {
  agent: string
  values: Record<string, string>
  updatedAt?: string | null
}

export interface DashboardSnapshot {
  workflows: WorkflowItem[]
  stats: WorkflowStats
  logs: LogItem[]
  notifications: NotificationItem[]
  settings: DashboardSettings
  history: LatestRun[]
  latestRun: LatestRun | null
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("flow_auth_token") : null
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Agent API error ${response.status}`)
  }
  return response.json() as Promise<T>
}

export async function register(email: string, password: string, name?: string) {
  return apiRequest<{ user: { id: string; email: string; name: string }; token: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  })
}

export async function login(email: string, password: string) {
  return apiRequest<{ token: string; user: { id: string; email: string; name: string } }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function getCurrentUser() {
  return apiRequest<{ user: { id: string; email: string; name: string } }>("/api/auth/me")
}

export async function getDashboardSnapshot() {
  return apiRequest<DashboardSnapshot>("/api/dashboard")
}

export async function invokeAgentWorkflow(task: string, userEmail?: string, workflowId?: string) {
  return apiRequest<{ status: string; results: unknown[]; latestRun: LatestRun; message: string }>("/api/agent-workflow", {
    method: "POST",
    body: JSON.stringify({ task, user_email: userEmail, workflow_id: workflowId }),
  })
}

export async function queueAgentWorkflow(task: string, userEmail?: string, workflowId?: string) {
  return apiRequest<{ status: string; latestRun: LatestRun; message: string }>("/api/agent-workflow/queue", {
    method: "POST",
    body: JSON.stringify({ task, user_email: userEmail, workflow_id: workflowId }),
  })
}

export async function getRun(runId: string) {
  return apiRequest<{ run: LatestRun }>(`/api/runs/${encodeURIComponent(runId)}`)
}

export async function createWorkflow(task: string, schedule?: string, name?: string) {
  return apiRequest<{ status: string; workflow: WorkflowItem }>("/api/workflows", {
    method: "POST",
    body: JSON.stringify({ task, schedule, name }),
  })
}

export async function toggleWorkflow(workflowId: string) {
  return apiRequest<{ status: string; workflow: WorkflowItem }>(`/api/workflows/${workflowId}/toggle`, {
    method: "POST",
  })
}

export async function replayWorkflow(workflowId: string) {
  return apiRequest<{ status: string; latestRun: LatestRun; message: string }>(`/api/workflows/${workflowId}/replay`, {
    method: "POST",
  })
}

export async function deleteWorkflow(workflowId: string) {
  return apiRequest<{ status: string }>(`/api/workflows/${workflowId}`, {
    method: "DELETE",
  })
}

export async function getLogs(level = "all") {
  return apiRequest<{ logs: LogItem[] }>(`/api/logs?level=${encodeURIComponent(level)}`)
}

export async function clearLogs() {
  return apiRequest<{ status: string }>("/api/logs", { method: "DELETE" })
}

export async function getAgentConfig(agentName: string) {
  return apiRequest<AgentConfig>(`/api/agents/${encodeURIComponent(agentName)}`)
}

export async function saveAgentConfig(agentName: string, values: Record<string, string>) {
  return apiRequest<AgentConfig>(`/api/agents/${encodeURIComponent(agentName)}`, {
    method: "PUT",
    body: JSON.stringify({ values }),
  })
}

export async function testAgentConfig(agentName: string) {
  return apiRequest<{ status: string; agent: string; message: string; config: AgentConfig }>(`/api/agents/${encodeURIComponent(agentName)}/test`, {
    method: "POST",
  })
}

export async function saveSettings(settings: DashboardSettings) {
  return apiRequest<DashboardSettings>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  })
}

export async function replayHistoryRun(runId: string) {
  return apiRequest<{ status: string; latestRun: LatestRun; message: string }>(`/api/history/${encodeURIComponent(runId)}/replay`, {
    method: "POST",
  })
}

export async function cloneHistoryRun(runId: string) {
  return apiRequest<{ status: string; workflow: WorkflowItem }>(`/api/history/${encodeURIComponent(runId)}/clone`, {
    method: "POST",
  })
}
