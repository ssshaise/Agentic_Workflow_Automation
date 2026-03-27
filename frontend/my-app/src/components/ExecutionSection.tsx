import { useEffect, useRef } from "react"

const nodes = [
  { icon: "search", label: "Scan", active: true },
  { icon: "psychology", label: "Reason", active: true },
  { icon: "summarize", label: "Summarize", active: false },
  { icon: "mail", label: "Deliver", active: false },
]

const steps = [
  { icon: "check", label: "Planner", sub: "Completed in 1.2s", state: "done" },
  { icon: "sync", label: "Tools & Scraper", sub: "Fetching arXiv data...", state: "active" },
  { icon: "pending", label: "Executor", sub: "Queued", state: "pending" },
  { icon: "lock", label: "Validator", sub: "Waiting", state: "pending" },
  { icon: "outbox", label: "Output", sub: "Final delivery", state: "pending" },
]

const stateStyles: Record<string, { bg: string; border: string; color: string }> = {
  done: { bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.25)", color: "#4ade80" },
  active: { bg: "rgba(190,157,255,0.1)", border: "rgba(190,157,255,0.25)", color: "#be9dff" },
  pending: { bg: "rgba(41,34,58,0.6)", border: "rgba(190,157,255,0.08)", color: "rgba(238,228,252,0.3)" },
}

export default function ExecutionSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add("reveal-visible")),
      { threshold: 0.1 }
    )
    sectionRef.current?.querySelectorAll(".reveal-hidden, .reveal-hidden-left, .reveal-hidden-scale").forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="snap-section" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "5rem 2rem", width: "100%" }}>

        <div className="section-eyebrow reveal-hidden">Live Execution</div>
        <h2 className="reveal-hidden" style={{ fontFamily: "Manrope,sans-serif", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
          Execution Map
        </h2>
        <p className="reveal-hidden" style={{ color: "rgba(238,228,252,0.45)", marginBottom: "2.5rem", fontSize: "0.9375rem" }}>
          Real-time logic orchestration across agents
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

          {/* Node Graph — full width */}
          <div className="liquid-glass feature-card reveal-hidden-scale" style={{ gridColumn: "span 2", padding: "1.75rem", borderRadius: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
              <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: "0.875rem" }}>
                Monitor arXiv → Summarize → Deliver
              </span>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.2rem 0.75rem", background: "rgba(190,157,255,0.08)", border: "1px solid rgba(190,157,255,0.2)", borderRadius: 999, fontSize: "0.625rem", fontWeight: 600, color: "#be9dff", letterSpacing: "0.06em" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#be9dff", animation: "pulse 2s infinite" }} />
                LIVE
              </div>
            </div>

            {/* Nodes */}
            <div style={{ display: "flex", alignItems: "center", padding: "0.5rem 1rem" }}>
              {nodes.map((n, i) => (
                <div key={n.label} style={{ display: "contents" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", zIndex: 1, opacity: n.active ? 1 : 0.35 }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: 14,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: n.active ? "rgba(190,157,255,0.08)" : "rgba(41,34,58,0.5)",
                      border: `1px solid ${n.active ? "rgba(190,157,255,0.3)" : "rgba(190,157,255,0.08)"}`,
                      boxShadow: n.active ? "0 0 18px rgba(190,157,255,0.12)" : "none",
                      transition: "all 0.3s",
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 22, color: n.active ? "#be9dff" : "rgba(238,228,252,0.3)" }}>{n.icon}</span>
                    </div>
                    <span style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: n.active ? "rgba(238,228,252,0.6)" : "rgba(238,228,252,0.25)" }}>
                      {n.label}
                    </span>
                  </div>
                  {i < nodes.length - 1 && (
                    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${n.active ? "rgba(190,157,255,0.3)" : "rgba(190,157,255,0.08)"}, ${nodes[i + 1].active ? "rgba(190,157,255,0.3)" : "rgba(190,157,255,0.06)"})`, position: "relative", overflow: "hidden" }} className={n.active ? "node-flow" : ""} />
                  )}
                </div>
              ))}
            </div>

            {/* Status bar */}
            <div style={{ marginTop: "1.5rem", padding: "0.75rem 1rem", background: "rgba(190,157,255,0.04)", border: "1px solid rgba(190,157,255,0.1)", borderRadius: 10, display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#be9dff", animation: "pulse 2s infinite" }} />
              <span style={{ fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(238,228,252,0.5)" }}>
                AGENT: Extracting metadata from arXiv:2403.0122v1...
              </span>
            </div>
          </div>

          {/* Terminal */}
          <div className="liquid-glass feature-card reveal-hidden" style={{ padding: "1.5rem", borderRadius: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: "rgba(238,228,252,0.3)" }}>terminal</span>
                <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: "0.8125rem" }}>Process Logs</span>
              </div>
              <span style={{ fontFamily: "monospace", fontSize: "0.625rem", color: "rgba(238,228,252,0.3)" }}>WKF-8821-X</span>
            </div>
            <div className="terminal-text" style={{ background: "rgba(8,6,14,0.6)", borderRadius: 10, padding: "0.875rem", maxHeight: 180, overflowY: "auto", border: "1px solid rgba(190,157,255,0.06)" }}>
              {[
                ["09:41:02", null, "Initializing system agent..."],
                ["09:41:05", "Planner", "Analyzing request..."],
                ["09:41:06", "Planner", "Strategy: Sequential scrape + LLM validation"],
                ["09:41:10", "Executor", "Accessing arxiv.org/list/cs.AI/recent..."],
                ["09:41:12", "Executor", "Found 12 entries. Processing #1..."],
              ].map(([time, tag, msg], i) => (
                <div key={i} style={{ color: "rgba(238,228,252,0.45)" }}>
                  <span style={{ color: "rgba(190,157,255,0.4)" }}>[{time}]</span>{" "}
                  {tag && <span style={{ color: tag === "Planner" ? "rgba(202,144,250,0.8)" : "#be9dff", fontWeight: 600 }}>[{tag}]</span>}{" "}
                  {msg}
                </div>
              ))}
              <div style={{ display: "flex", gap: 3, paddingTop: 4 }}>
                {[0, 0.25, 0.5].map(d => (
                  <div key={d} style={{ width: 4, height: 4, borderRadius: "50%", background: "#be9dff", animation: `pulse 1s ${d}s infinite` }} />
                ))}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="liquid-glass feature-card reveal-hidden" style={{ padding: "1.5rem", borderRadius: 16 }}>
            <div style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: "0.8125rem", marginBottom: "1.5rem" }}>Workflow Progress</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative" }}>
              <div style={{ position: "absolute", left: 13, top: 0, bottom: 0, width: 1, background: "rgba(190,157,255,0.08)" }} />
              {steps.map(s => {
                const st = stateStyles[s.state]
                return (
                  <div key={s.label} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", position: "relative" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: st.bg, border: `1px solid ${st.border}`, position: "relative", zIndex: 1 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: st.color, animation: s.state === "active" ? "spin 1.5s linear infinite" : "none" }}>{s.icon}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: s.state === "pending" ? "rgba(238,228,252,0.4)" : "#eee4fc" }}>{s.label}</div>
                      <div style={{ fontSize: "0.6875rem", color: st.color, marginTop: 2 }}>{s.sub}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
