import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import BgVideo from "../BgVideo"

type AuthShellProps = {
  title: string
  subtitle: string
  eyebrow?: string
  asideTitle: string
  asideBody: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthShell({
  title,
  subtitle,
  eyebrow = "Flow Access",
  asideTitle,
  asideBody,
  children,
  footer,
}: AuthShellProps) {
  return (
    <>
      <BgVideo />
      <div
        style={{
          minHeight: "100vh",
          position: "relative",
          display: "grid",
          gridTemplateColumns: "minmax(320px, 1.15fr) minmax(380px, 520px)",
          gap: "2rem",
          padding: "2rem",
          alignItems: "stretch",
        }}
      >
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "calc(100vh - 4rem)",
            padding: "1rem 0 1rem 0.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <Link
              to="/"
              style={{
                color: "#eee4fc",
                fontFamily: "Manrope, sans-serif",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textDecoration: "none",
                fontSize: "1rem",
              }}
            >
              FLOW
            </Link>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {["Autonomous workflows", "Secure auth", "Email-ready"].map((item) => (
                <span
                  key={item}
                  style={{
                    padding: "0.35rem 0.7rem",
                    borderRadius: 999,
                    background: "rgba(41,34,58,0.5)",
                    border: "1px solid rgba(190,157,255,0.12)",
                    color: "rgba(238,228,252,0.6)",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div style={{ maxWidth: 700, padding: "4rem 0" }}>
            <div className="section-eyebrow">{eyebrow}</div>
            <h1
              className="hero-gradient-text"
              style={{
                margin: 0,
                fontFamily: "Manrope, sans-serif",
                fontSize: "clamp(2.7rem, 6vw, 5.75rem)",
                fontWeight: 500,
                lineHeight: 0.96,
                letterSpacing: "-0.045em",
              }}
            >
              {title}
            </h1>
            <p
              style={{
                maxWidth: 560,
                marginTop: "1.25rem",
                color: "rgba(238,228,252,0.68)",
                fontSize: "1.05rem",
                lineHeight: 1.9,
              }}
            >
              {subtitle}
            </p>
          </div>

          <div
            className="liquid-glass"
            style={{
              borderRadius: 28,
              padding: "1.3rem 1.4rem",
              maxWidth: 540,
              boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
            }}
          >
            <div style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: "1rem", marginBottom: "0.55rem" }}>{asideTitle}</div>
            <div style={{ color: "rgba(238,228,252,0.56)", lineHeight: 1.7, fontSize: "0.92rem" }}>{asideBody}</div>
          </div>
        </section>

        <section
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </section>

        {footer && (
          <div
            style={{
              position: "absolute",
              left: "2rem",
              right: "2rem",
              bottom: "1rem",
              display: "flex",
              justifyContent: "center",
              color: "rgba(238,228,252,0.38)",
              fontSize: "0.78rem",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  )
}
