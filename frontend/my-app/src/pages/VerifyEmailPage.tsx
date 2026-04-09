import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import AuthCard from "../components/auth/AuthCard"
import AuthShell from "../components/auth/AuthShell"
import { confirmEmailVerification, requestEmailVerification } from "../services/agentApi"

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const token = searchParams.get("token")
  const routeState = (location.state as { email?: string; initialMessage?: string; verificationUrl?: string } | null) || null
  const email = routeState?.email || ""
  const initialMessage = routeState?.initialMessage
  const initialVerificationUrl = routeState?.verificationUrl || ""
  const [status, setStatus] = useState<"idle" | "loading" | "verified" | "error">(token ? "loading" : "idle")
  const [message, setMessage] = useState(
    token
      ? "Confirming your verification token."
      : initialMessage || "Check your inbox for a verification link. You can come back here anytime to resend it."
  )
  const [resending, setResending] = useState(false)
  const [verificationUrl, setVerificationUrl] = useState(initialVerificationUrl)

  useEffect(() => {
    if (!token) return
    let active = true
    confirmEmailVerification(token)
      .then((response) => {
        if (!active) return
        setStatus("verified")
        setMessage(response.message || "Email verified successfully.")
        window.setTimeout(() => navigate("/dashboard"), 1200)
      })
      .catch((error) => {
        if (!active) return
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "Unable to verify email.")
      })
    return () => {
      active = false
    }
  }, [token, navigate])

  async function handleResend() {
    setResending(true)
    try {
      const response = await requestEmailVerification()
      setStatus("idle")
      setMessage(response.message || "Verification email sent.")
      setVerificationUrl(response.verificationUrl || "")
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Unable to resend verification.")
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title="Verify the identity behind the workflows."
      subtitle="Account-email verification confirms who owns the Flow account. It still remains separate from mailbox access used for SMTP sending."
    >
      <AuthCard title={status === "verified" ? "Email verified" : "Verify your email"} description="Open the verification link from your inbox. If the link is already open in this page, we will confirm it automatically.">
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ borderRadius: 16, padding: "1rem", background: status === "verified" ? "rgba(74,222,128,0.08)" : status === "error" ? "rgba(239,68,68,0.08)" : "rgba(190,157,255,0.08)", border: status === "verified" ? "1px solid rgba(74,222,128,0.16)" : status === "error" ? "1px solid rgba(239,68,68,0.16)" : "1px solid rgba(190,157,255,0.14)", color: status === "verified" ? "#b6ffd4" : status === "error" ? "#ffbac3" : "#e8ddff", lineHeight: 1.7, fontSize: "0.92rem" }}>
            {message}
          </div>
          {email && <div style={{ color: "rgba(238,228,252,0.5)", fontSize: "0.82rem" }}>Verification target: <span style={{ color: "#eee4fc" }}>{email}</span></div>}
          {!token && verificationUrl && (
            <a
              href={verificationUrl}
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                boxSizing: "border-box",
                padding: "0.95rem 1rem",
                borderRadius: 999,
                background: "rgba(190,157,255,0.08)",
                border: "1px solid rgba(190,157,255,0.18)",
                color: "#d7c0ff",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Open Verification Link
            </a>
          )}
          {!token && (
            <button className="btn-glass" type="button" onClick={handleResend} disabled={resending} style={{ width: "100%", display: "inline-flex", justifyContent: "center", opacity: resending ? 0.8 : 1 }}>
              {resending ? "Sending..." : "Resend Verification Email"}
            </button>
          )}
          <div style={{ textAlign: "center", color: "rgba(238,228,252,0.52)", fontSize: "0.88rem" }}>
            <Link to="/login" style={{ color: "#be9dff", textDecoration: "none", fontWeight: 700 }}>Back to sign in</Link>
          </div>
        </div>
      </AuthCard>
    </AuthShell>
  )
}
