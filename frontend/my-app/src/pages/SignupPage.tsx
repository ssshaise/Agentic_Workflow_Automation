import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import AuthCard from "../components/auth/AuthCard"
import AuthField from "../components/auth/AuthField"
import AuthFormFooter from "../components/auth/AuthFormFooter"
import AuthShell from "../components/auth/AuthShell"
import { register, requestEmailVerification } from "../services/agentApi"

export default function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    setLoading(true)
    try {
      await register(email, password, name)
      const verification = await requestEmailVerification()
      navigate("/verify-email", {
        state: {
          email,
          initialMessage: verification.message,
          verificationUrl: verification.verificationUrl,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Build with verified intent."
      subtitle="Create your Flow account first, then verify your email before you configure mailbox delivery."
    >
      <AuthCard title="Create account" description="Start with your Flow account credentials. Sending credentials come later in settings.">
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <AuthField label="Name" value={name} placeholder="Ruchi" autoComplete="name" onChange={setName} />
          <AuthField label="Email" type="email" value={email} placeholder="you@company.com" autoComplete="email" onChange={setEmail} />
          <AuthField label="Password" type="password" value={password} placeholder="At least 8 characters" autoComplete="new-password" onChange={setPassword} />
          <AuthField label="Confirm password" type="password" value={confirmPassword} placeholder="Re-enter password" autoComplete="new-password" onChange={setConfirmPassword} />
          {error && <div style={{ borderRadius: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.16)", padding: "0.85rem 1rem", color: "#ffb5c0", fontSize: "0.86rem" }}>{error}</div>}
          <button className="btn-glass" type="submit" disabled={loading} style={{ width: "100%", display: "inline-flex", justifyContent: "center", opacity: loading ? 0.8 : 1 }}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
          <AuthFormFooter prompt="Already have an account?" actionLabel="Sign in" actionTo="/login" />
        </form>
      </AuthCard>
    </AuthShell>
  )
}
