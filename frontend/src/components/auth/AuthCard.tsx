import type { ReactNode } from "react"

type AuthCardProps = {
  title: string
  description: string
  children: ReactNode
}

export default function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div
      className="liquid-glass"
      style={{
        width: "100%",
        maxWidth: 460,
        borderRadius: 30,
        padding: "1.35rem",
        boxShadow: "0 28px 80px rgba(0,0,0,0.28)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at top right, rgba(190,157,255,0.18), transparent 38%), radial-gradient(circle at bottom left, rgba(88,203,255,0.14), transparent 30%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          borderRadius: 24,
          padding: "1.45rem",
          background: "linear-gradient(180deg, rgba(18,12,31,0.86) 0%, rgba(12,9,21,0.95) 100%)",
          border: "1px solid rgba(190,157,255,0.14)",
        }}
      >
        <div style={{ marginBottom: "1.3rem" }}>
          <h2 style={{ margin: 0, fontFamily: "Manrope, sans-serif", fontSize: "1.55rem", color: "#eee4fc" }}>{title}</h2>
          <p style={{ margin: "0.55rem 0 0", color: "rgba(238,228,252,0.58)", lineHeight: 1.7, fontSize: "0.92rem" }}>{description}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
