import { useEffect, useRef } from "react"

export default function ReasoningSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add("reveal-visible")),
      { threshold: 0.1 }
    )
    sectionRef.current?.querySelectorAll(".reveal-hidden, .reveal-hidden-left").forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="snap-section" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "5rem 2rem", width: "100%" }}>

        <div className="section-eyebrow reveal-hidden">Agent Intelligence</div>
        <h2 className="reveal-hidden" style={{ fontFamily: "Manrope,sans-serif", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
          Reasoning &amp; Output
        </h2>
        <p className="reveal-hidden" style={{ color: "rgba(238,228,252,0.45)", marginBottom: "2.5rem", fontSize: "0.9375rem" }}>
          Live agent thought process and generated results
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

          {/* Agent Reasoning */}
          <div className="liquid-glass feature-card reveal-hidden-left" style={{ padding: "1.75rem", borderRadius: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 17, color: "rgba(190,157,255,0.5)" }}>lightbulb</span>
              <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: "0.875rem" }}>Agent Reasoning</span>
              <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.15rem 0.625rem", background: "rgba(190,157,255,0.08)", border: "1px solid rgba(190,157,255,0.15)", borderRadius: 999, fontSize: "0.5625rem", fontWeight: 600, color: "rgba(190,157,255,0.7)", letterSpacing: "0.06em" }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#be9dff", animation: "pulse 2s infinite" }} /> LIVE
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { tag: "Optimization", border: "rgba(190,157,255,0.4)", text: "To optimize for latency, I will parallelize summary generation for the first 5 papers detected." },
                { tag: "Rate Limit Handling", border: "rgba(245,158,11,0.4)", text: "Identified potential rate limit on arXiv API. Implemented 200ms stagger between requests to ensure completion." },
              ].map(item => (
                <div key={item.tag} style={{ padding: "1rem", background: "rgba(41,34,58,0.5)", borderRadius: 10, borderLeft: `2px solid ${item.border}` }}>
                  <div style={{ fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(238,228,252,0.3)", marginBottom: "0.375rem" }}>{item.tag}</div>
                  <p style={{ fontSize: "0.8125rem", color: "rgba(238,228,252,0.55)", lineHeight: 1.65 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Result Preview */}
          <div className="liquid-glass feature-card reveal-hidden-left" style={{ padding: "1.75rem", borderRadius: 16, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 17, color: "rgba(190,157,255,0.5)" }}>description</span>
              <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: "0.875rem" }}>Result Preview</span>
            </div>

            <div style={{ flex: 1, background: "rgba(41,34,58,0.5)", borderRadius: 10, padding: "1.25rem", marginBottom: "1.25rem", border: "1px solid rgba(190,157,255,0.08)" }}>
              <div style={{ fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(238,228,252,0.3)", marginBottom: "0.625rem" }}>Generated Abstract</div>
              <p style={{ fontSize: "0.8125rem", color: "rgba(238,228,252,0.55)", lineHeight: 1.7, fontStyle: "italic" }}>
                "The study explores a new transformer-based architecture for real-time edge computing with significantly reduced latency..."
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {[["12", "Papers found", "#eee4fc"], ["5", "Processed", "#4ade80"]].map(([val, label, color]) => (
                <div key={label} style={{ background: "rgba(41,34,58,0.5)", borderRadius: 10, padding: "0.875rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.375rem", fontWeight: 700, color, fontFamily: "Manrope,sans-serif" }}>{val}</div>
                  <div style={{ fontSize: "0.6875rem", color: "rgba(238,228,252,0.35)", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            <button className="btn-glass" style={{ justifyContent: "center", borderRadius: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span> Download JSON
            </button>
          </div>

        </div>
      </div>
    </section>
  )
}
