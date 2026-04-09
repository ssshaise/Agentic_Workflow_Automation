import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import BgVideo from "../BgVideo"

type Props = {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <>
      <BgVideo />
      <div
        style={{
          minHeight: "100vh",
          position: "relative",
          display: "grid",
          gridTemplateColumns: "minmax(320px, 1.1fr) minmax(360px, 500px)",
          gap: "2rem",
          padding: "1rem 2rem 2rem  ",
          alignItems: "center",
        }}
      >
        <section style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 4rem)", padding: "0.25rem 0 1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.9rem" }}>
            <Link to="/" style={{ color: "#eee4fc", textDecoration: "none", fontFamily: "Manrope,sans-serif", fontWeight: 800, letterSpacing: "0.08em", fontSize: "1rem" }}>
              FLOW
            </Link>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: "-1.5rem", marginLeft: "32rem" }}>
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", justifyContent: "center" }}>
              {["Secure auth", "Verified email", "Agent access"].map((item) => (
                <span
                  key={item}
                  style={{
                    padding: "0.42rem 0.82rem",
                    borderRadius: 999,
                    background: "rgba(41,34,58,0.5)",
                    border: "1px solid rgba(190,157,255,0.12)",
                    color: "rgba(238,228,252,0.6)",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
            <div style={{ width: "100%", maxWidth: 760, paddingRight: "1.5rem" }}>
              <div
                style={{
                  width: "100%",
                  maxWidth: 900,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  minHeight: 630,
                }}
              >
                <div className="section-eyebrow">Flow Access</div>
                <h1
                  className="hero-gradient-text"
                  style={{
                    margin: 0,
                    fontFamily: "Manrope,sans-serif",
                    fontSize: "clamp(3.2rem, 6.4vw, 6.1rem)",
                    fontWeight: 500,
                    lineHeight: 0.92,
                    letterSpacing: "-0.05em",
                    maxWidth: 650,
                  }}
                >
                  {title}
                </h1>
                <p
                  style={{
                    maxWidth: 650,
                    marginTop: "1.35rem",
                    color: "rgba(238,228,252,0.68)",
                    fontSize: "1.08rem",
                    lineHeight: 1.9,
                  }}
                >
                  {subtitle}
                </p>
              </div>
            </div>
          </div>

        </section>

        <section style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 4rem)" }}>{children}</section>

        {footer && (
          <div style={{ position: "absolute", left: "2rem", right: "2rem", bottom: "1rem", display: "flex", justifyContent: "center", color: "rgba(238,228,252,0.38)", fontSize: "0.78rem" }}>
            {footer}
          </div>
        )}
      </div>
    </>
  )
}
