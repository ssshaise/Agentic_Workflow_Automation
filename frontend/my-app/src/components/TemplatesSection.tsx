import { useEffect, useRef } from "react"

const templates = [
  { icon: "trending_up", title: "Market Sentiment Monitor", desc: "Scrape financial news, analyze sentiment using GPT-4, and alert via Slack if score drops below threshold.", runs: "1.2k", color: "rgba(190,157,255,0.12)", iconColor: "#be9dff", wide: true, prompt: "Monitor financial news → analyze sentiment with GPT-4 → alert via Slack if score drops below threshold" },
  { icon: "shopping_cart", title: "Inventory Sync", desc: "Auto-sync Shopify stock with warehouse DB every hour.", runs: "843", color: "rgba(74,222,128,0.08)", iconColor: "#4ade80", wide: false, prompt: "Fetch Shopify inventory → compare with warehouse DB → sync discrepancies every hour" },
  { icon: "calendar_today", title: "Smart Scheduler", desc: "AI-managed meeting scheduling based on email context.", runs: "621", color: "rgba(245,158,11,0.08)", iconColor: "#f59e0b", wide: false, prompt: "Read incoming emails → detect meeting requests → auto-schedule based on calendar availability" },
  { icon: "bug_report", title: "Error Monitor", desc: "Watch production logs and auto-create GitHub issues on error spikes.", runs: "412", color: "rgba(239,68,68,0.08)", iconColor: "#ef4444", wide: false, prompt: "Monitor production logs → detect error spikes → auto-create GitHub issues with context" },
  { icon: "summarize", title: "Research Digest", desc: "Daily arXiv summaries delivered to your inbox every morning.", runs: "389", color: "rgba(168,85,247,0.08)", iconColor: "#a855f7", wide: false, prompt: "Fetch latest arXiv papers → summarize with LLM → send digest email every morning at 8am" },
]

interface Props {
  onUseTemplate?: (prompt: string) => void
}

export default function TemplatesSection({ onUseTemplate }: Props) {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add("reveal-visible")),
      { threshold: 0.08 }
    )
    sectionRef.current?.querySelectorAll(".reveal-hidden, .reveal-hidden-scale, .dawn-reveal, .dawn-reveal-scale").forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const handleUse = (prompt: string) => {
    onUseTemplate?.(prompt)
    // Scroll back to top (hero input section)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const footerLinks: Record<string, string> = {
    "Privacy Policy": "https://openai.com/policies/privacy-policy/",
    "Terms of Service": "https://openai.com/policies/terms-of-use/",
    "API Reference": "https://platform.openai.com/docs/api-reference",
  }

  const footerButtons: Record<string, string> = {
    alternate_email: "mailto:support@flow.local",
    code: "https://platform.openai.com/docs",
  }

  return (
    <section ref={sectionRef} className="snap-section" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "5.25rem 2.5rem", width: "100%" }}>
        <div className="section-eyebrow dawn-reveal dawn-delay-1">Get started fast</div>
        <h2 className="dawn-reveal dawn-delay-2" style={{ fontFamily: "Manrope,sans-serif", fontSize: "clamp(2rem,3.8vw,2.9rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.65rem" }}>
          Popular Templates
        </h2>
        <p className="dawn-reveal dawn-delay-3" style={{ color: "rgba(238,228,252,0.45)", marginBottom: "3rem", fontSize: "1.05rem", maxWidth: 720, lineHeight: 1.75 }}>
          Pre-built workflows ready to deploy in one click
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.35rem" }}>
          {templates.map((t, i) => (
            <div key={t.title} className={`liquid-glass feature-card dawn-reveal-scale dashboard-lift-card dawn-delay-${Math.min(i + 4, 8)}`} style={{ gridColumn: t.wide ? "span 2" : "span 1", padding: "1.8rem", borderRadius: 20, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.4rem" }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: t.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: t.iconColor }}>{t.icon}</span>
                </div>
                <span style={{ fontSize: "0.76rem", color: "rgba(238,228,252,0.3)", fontWeight: 500 }}>{t.runs} runs</span>
              </div>
              <div style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: t.wide ? "1.14rem" : "1.04rem", marginBottom: "0.6rem", color: "#eee4fc" }}>{t.title}</div>
              <p style={{ fontSize: "0.92rem", color: "rgba(238,228,252,0.45)", lineHeight: 1.72, marginBottom: "1.4rem" }}>{t.desc}</p>
              <button
                className="btn-glass"
                style={{ fontSize: "0.82rem", padding: "0.46rem 1.1rem", borderRadius: 10 }}
                onClick={() => handleUse(t.prompt)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_upward</span> Use template
              </button>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ borderTop: "1px solid rgba(190,157,255,0.08)", padding: "1.5rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: "0.875rem", color: "#eee4fc" }}>FLOW</span>
          <span style={{ color: "rgba(238,228,252,0.25)", fontSize: "0.75rem" }}>© 2026 Flow Automation Systems</span>
        </div>
        <div style={{ display: "flex", gap: "2rem" }}>
          {["Privacy Policy", "Terms of Service", "API Reference"].map(l => (
            <a key={l} href={footerLinks[l]} style={{ color: "rgba(238,228,252,0.3)", fontSize: "0.75rem", textDecoration: "none", fontFamily: "Manrope,sans-serif" }}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["alternate_email", "code"].map(icon => (
            <button key={icon} onClick={() => window.open(footerButtons[icon], "_blank", "noopener,noreferrer")} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(41,34,58,0.5)", border: "1px solid rgba(190,157,255,0.1)", color: "rgba(238,228,252,0.35)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
            </button>
          ))}
        </div>
      </footer>
    </section>
  )
}
