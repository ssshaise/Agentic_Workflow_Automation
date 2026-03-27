import { useEffect, useRef } from "react"

export default function BentoSection() {
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
    <section ref={sectionRef} style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 2rem 8rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridAutoRows: "400px", gap: "1.5rem" }}>

        {/* Large card — spans 2 cols */}
        <div
          className="liquid-glass feature-card reveal-hidden"
          style={{ gridColumn: "span 2", borderRadius: "1rem", padding: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", overflow: "hidden" }}
        >
          <div style={{ position: "absolute", top: 0, right: 0, padding: "2rem", color: "rgba(190,157,255,0.35)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "4.5rem" }}>analytics</span>
          </div>
          <h3 style={{ fontFamily: "Manrope,sans-serif", fontSize: "1.75rem", fontWeight: 700, marginBottom: "1rem", color: "#eee4fc" }}>
            Multi-Agent Validation &amp; Memory
          </h3>
          <p style={{ color: "#b0a7be", maxWidth: "28rem", lineHeight: 1.7, fontSize: "0.9375rem" }}>
            Transforms natural language instructions into structured multi-step workflows using planner agents powered by LLM reasoning.
          </p>
        </div>

        {/* Vertical card */}
        <div
          className="liquid-glass feature-card reveal-hidden"
          style={{ borderRadius: "1rem", padding: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "2.25rem", color: "#be9dff" }}>diversity_3</span>
          <div>
            <h3 style={{ fontFamily: "Manrope,sans-serif", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "#eee4fc" }}>
              Runtime Tool Generation
            </h3>
            <p style={{ color: "#b0a7be", fontSize: "0.875rem", lineHeight: 1.7 }}>
              Creates and executes tools dynamically during runtime, including API calls, scripts, and data processing tasks.
            </p>
          </div>
        </div>

        {/* Center icon card */}
        <div
          className="liquid-glass feature-card reveal-hidden"
          style={{ borderRadius: "1rem", padding: "2.5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "1.5rem" }}
        >
          <div style={{ width: "5rem", height: "5rem", borderRadius: "9999px", background: "rgba(190,157,255,0.15)", border: "1px solid rgba(190,157,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "2.5rem", color: "#be9dff" }}>bolt</span>
          </div>
          <div>
            <h3 style={{ fontFamily: "Manrope,sans-serif", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem", color: "#eee4fc" }}>
              Autonomous Execution
            </h3>
            <p style={{ color: "#b0a7be", fontSize: "0.875rem", lineHeight: 1.7 }}>
              Executor agents run each step automatically and coordinate with other agents to complete complex workflows.
            </p>
          </div>
        </div>

        {/* Wide image card — spans 2 cols */}
        <div
          className="liquid-glass feature-card reveal-hidden"
          style={{ gridColumn: "span 2", borderRadius: "1rem", overflow: "hidden", position: "relative" }}
        >
          <img
            alt="Analytics Dashboard"
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.25, transition: "transform 0.7s" }}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQQQ-eesBLsgCVJ2Ljha5GrMlYCPcKEClWM1v8X6ULx1-Y-RGdRVkxzujVSpIWAzJ0kPXrC8Xl7YSC_UG-8X1eAmZygUBKqpm783TeF3oL2iGwTD1pRgiljvX0mwez1H7d8Am_z2F9KoM9MgWQN98dcqEUvH14aNmUxXkJ0_FwjV9XcHKkVF3wsDuTwm8Q5wyJmIaKeHsGqEIw2lExmeYGZlMJe_5ExCYbX49C5hSQahw5WBSNYq76WDfF5qIqyuaxkdxK8cbVahc"
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,#100b1c 0%,rgba(16,11,28,0.5) 40%,transparent 100%)", padding: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <h3 style={{ fontFamily: "Manrope,sans-serif", fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", color: "#eee4fc" }}>
              Multi-Agent Validation &amp; Memory
            </h3>
            <p style={{ color: "#b0a7be", maxWidth: "36rem", lineHeight: 1.7, fontSize: "0.9375rem" }}>
              Validator and monitor agents verify outputs, retry failed steps, and store workflow history using vector database memory.
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}
