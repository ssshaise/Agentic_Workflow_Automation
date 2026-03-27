import { useEffect, useRef } from "react"

export default function MissionSection() {
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
    <section ref={sectionRef} style={{ padding: "8rem 2rem", background: "rgba(190,157,255,0.03)" }}>
      <div className="reveal-hidden" style={{ maxWidth: "52rem", margin: "0 auto", textAlign: "center" }}>
        <span style={{ color: "#be9dff", fontFamily: "Manrope,sans-serif", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", fontSize: "0.75rem", display: "block", marginBottom: "1.5rem" }}>
          Our Mission
        </span>
        <h2 style={{ fontFamily: "Manrope,sans-serif", fontSize: "clamp(1.75rem,4vw,3rem)", fontWeight: 400, lineHeight: 1.5, color: "#eee4fc", margin: 0 }}>
          To accelerate human productivity by enabling autonomous AI agents to plan,{" "}
          <span className="mission-italic">execute</span>{" "}and{" "}
          <span className="mission-italic">automate</span>{" "}
          complex workflows at the speed of thought.
        </h2>
        <div style={{ marginTop: "4rem", width: "6rem", height: "4px", background: "linear-gradient(to right,transparent,#be9dff,transparent)", marginLeft: "auto", marginRight: "auto", opacity: 0.3, borderRadius: "9999px" }} />
      </div>
    </section>
  )
}
