const AUTH_TOKEN_KEY = "flow.auth.token"
const AUTH_USER_KEY = "flow.auth.user"

export type StoredAuthUser = {
  id: string
  email: string
  name: string
  createdAt: string
  emailVerified?: boolean
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function getAuthToken(): string | null {
  if (!canUseStorage()) return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthSession(token: string, user: StoredAuthUser) {
  if (!canUseStorage()) return
  window.localStorage.setItem(AUTH_TOKEN_KEY, token)
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(AUTH_USER_KEY)
}

export function getStoredAuthUser(): StoredAuthUser | null {
  if (!canUseStorage()) return null
  const raw = window.localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredAuthUser
  } catch {
    return null
  }
}
