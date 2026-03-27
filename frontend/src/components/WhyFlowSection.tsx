import { useEffect, useRef } from "react"

const features = [
  {
    icon: "psychology",
    title: "Dynamic Task Planning",
    desc: "We built an autonomous agentic workflow engine that plans, executes, and validates complex tasks using multi-agent AI.",
  },
  {
    icon: "auto_graph",
    title: "Autonomous Execution",
    desc: "Agents create tools at runtime, call APIs, run code, and complete workflows without human intervention.",
  },
  {
    icon: "verified_user",
    title: "Multi-Agent Validation",
    desc: "Agents create tools at runtime, call APIs, run code, and complete workflows without human intervention.",
  },
]

export default function WhyFlowSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add("reveal-visible")),
      { threshold: 0.12 }
    )
    sectionRef.current?.querySelectorAll(".reveal-hidden").forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} style={{ maxWidth: "80rem", margin: "0 auto", padding: "8rem 2rem" }}>
      <div className="reveal-hidden" style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h2 style={{ fontFamily: "Manrope,sans-serif", fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 700, color: "#eee4fc", marginBottom: "1rem" }}>
          Why FLOW?
        </h2>
        <p style={{ color: "#b0a7be", fontSize: "1rem", maxWidth: "30rem", margin: "0 auto", lineHeight: 1.7 }}>
          I built an autonomous agentic workflow engine that plans, executes, and validates complex tasks using multi-agent AI.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "1.5rem" }}>
        {features.map((f) => (
          <div key={f.title} className="liquid-glass feature-card reveal-hidden" style={{ borderRadius: "1rem", padding: "2.5rem" }}>
            <div style={{ width: "3.5rem", height: "3.5rem", background: "rgba(190,157,255,0.1)", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2rem" }}>
              <span className="material-symbols-outlined" style={{ color: "#be9dff", fontSize: "1.75rem" }}>{f.icon}</span>
            </div>
            <h3 style={{ fontFamily: "Manrope,sans-serif", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "#eee4fc" }}>
              {f.title}
            </h3>
            <p style={{ color: "#b0a7be", lineHeight: 1.7, fontSize: "0.9375rem" }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
