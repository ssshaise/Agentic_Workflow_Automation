import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import AuthCard from "../components/auth/AuthCard"
import AuthField from "../components/auth/AuthField"
import AuthFormFooter from "../components/auth/AuthFormFooter"
import AuthShell from "../components/auth/AuthShell"
import { loginUser } from "../services/agentApi"

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: string } | null)?.from || "/dashboard"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      await loginUser({ email, password })
      navigate(from)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Return to command."
      subtitle="Sign in to run workflows under your own account, keep settings synced, and manage verified delivery channels from one place."
      asideTitle="What signs in here?"
      asideBody="This form authenticates the user's Flow account. It does not ask for the mailbox app password used later in SMTP settings."
      footer={<Link to="/" style={{ color: "rgba(238,228,252,0.5)", textDecoration: "none" }}>Back to home</Link>}
    >
      <AuthCard
        title="Welcome back"
        description="Use your Flow account credentials to continue into the automation dashboard."
      >
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <AuthField label="Email" type="email" value={email} placeholder="you@company.com" autoComplete="email" onChange={setEmail} />
          <AuthField label="Password" type="password" value={password} placeholder="Enter your account password" autoComplete="current-password" onChange={setPassword} />

          {error && (
            <div style={{ borderRadius: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.16)", padding: "0.85rem 1rem", color: "#ffb5c0", fontSize: "0.86rem" }}>
              {error}
            </div>
          )}

          <button className="btn-glass" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", display: "inline-flex", opacity: loading ? 0.8 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div style={{ display: "grid", gap: "0.8rem" }}>
            <AuthFormFooter prompt="New to Flow?" actionLabel="Create an account" actionTo="/signup" />
            <div style={{ textAlign: "center", color: "rgba(238,228,252,0.38)", fontSize: "0.78rem", lineHeight: 1.6 }}>
              After sign-in, account email verification and mailbox sending setup remain separate for security.
            </div>
          </div>
        </form>
      </AuthCard>
    </AuthShell>
  )
}
