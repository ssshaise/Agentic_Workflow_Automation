import { clearAuthSession, getAuthToken, setAuthSession, type StoredAuthUser } from "./authStorage"

export async function invokeAgentWorkflow(task: string, userEmail?: string) {
  const response = await fetch("/api/agent-workflow", {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ task, user_email: userEmail }),
  });
  if (!response.ok) {
    throw new Error(`Agent API error ${response.status}`);
  }
  return response.json();
}

export type SettingsPayload = {
  general: Record<string, string>
  notifications: Record<string, string | boolean>
  apiKeys: Record<string, string>
  updatedAt?: string
}

export type ViewerPayload = {
  user: {
    id: string
    email: string
    name: string
    createdAt: string
    emailVerified?: boolean
  }
}

type AuthRequest = {
  email: string
  password: string
  name?: string
}

type AuthResponse = {
  token: string
  user: StoredAuthUser
}

function buildHeaders(initial?: Record<string, string>): HeadersInit {
  const token = getAuthToken()
  return {
    ...(initial || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `API error ${response.status}`
    try {
      const body = await response.json()
      message = body.detail || body.message || message
    } catch {
      // Ignore JSON parsing failures and preserve the default message.
    }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export async function getSettings(): Promise<SettingsPayload> {
  const response = await fetch("/api/settings", { headers: buildHeaders() })
  return readJson<SettingsPayload>(response)
}

export async function saveSettings(payload: SettingsPayload): Promise<SettingsPayload> {
  const response = await fetch("/api/settings", {
    method: "PUT",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  })
  return readJson<SettingsPayload>(response)
}

export async function getViewer(): Promise<ViewerPayload> {
  const response = await fetch("/api/auth/me", { headers: buildHeaders() })
  return readJson<ViewerPayload>(response)
}

export async function requestEmailVerification(): Promise<{ status: string; message: string; verificationUrl?: string }> {
  const response = await fetch("/api/auth/verify-email/request", {
    method: "POST",
    headers: buildHeaders(),
  })
  return readJson<{ status: string; message: string; verificationUrl?: string }>(response)
}

export async function confirmEmailVerification(token: string): Promise<{ status: string; message: string; user?: StoredAuthUser }> {
  const response = await fetch(`/api/auth/verify-email/confirm?token=${encodeURIComponent(token)}`, {
    headers: buildHeaders(),
  })
  return readJson<{ status: string; message: string; user?: StoredAuthUser }>(response)
}

export async function loginUser(payload: AuthRequest): Promise<AuthResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await readJson<AuthResponse>(response)
  setAuthSession(data.token, data.user)
  return data
}

export async function registerUser(payload: AuthRequest): Promise<AuthResponse> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await readJson<AuthResponse>(response)
  setAuthSession(data.token, data.user)
  return data
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: buildHeaders(),
    })
  } finally {
    clearAuthSession()
  }
}
