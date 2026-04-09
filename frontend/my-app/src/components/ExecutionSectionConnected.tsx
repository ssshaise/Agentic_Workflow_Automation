import { useEffect, useRef } from "react"
import type { LatestRun } from "../services/agentApi"

interface Props {
  latestRun: LatestRun | null
}

export default function ExecutionSectionConnected({ latestRun }: Props) {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add("reveal-visible")),
      { threshold: 0.1 }
    )
    sectionRef.current?.querySelectorAll(".reveal-hidden, .reveal-hidden-left, .reveal-hidden-scale, .dashboard-slide-up, .dawn-reveal, .dawn-reveal-scale").forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const isFallback = latestRun?.mode === "fallback"
  const isLocal = latestRun?.mode === "local"
  const isManaged = latestRun?.mode === "flow-managed"
  const steps = latestRun
    ? [
        { icon: "check", label: "Planner", sub: "Completed", state: "done" },
        { icon: "check", label: "Executor", sub: isFallback ? `${latestRun.output.processed} fallback steps processed` : isLocal ? `${latestRun.output.processed} local execution steps processed` : isManaged ? `${latestRun.output.processed} FLOW-managed steps processed` : `${latestRun.output.processed} steps processed`, state: "done" },
        { icon: "check", label: "Validator", sub: isFallback ? "Fallback validation passed" : isLocal ? "Local workflow validation passed" : isManaged ? "FLOW delivery checks passed" : "Validation passed", state: "done" },
        { icon: "outbox", label: "Output", sub: isFallback ? `Fallback result in ${latestRun.duration}` : isLocal ? `Local result in ${latestRun.duration}` : isManaged ? `FLOW result in ${latestRun.duration}` : latestRun.duration, state: "done" },
      ]
    : [
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

  const nodeLabels = ["Scan", "Reason", "Summarize", "Deliver"]
  const processed = latestRun?.output.processed || 0
  const renderLogEntry = (result: unknown, index: number) => {
    const raw = JSON.stringify(result, null, 2)
    const clipped = raw.length > 420 ? `${raw.slice(0, 420)}...` : raw
    return (
      <div key={index} style={{ color: "rgba(238,228,252,0.45)", minWidth: 0, overflow: "hidden" }}>
        <span style={{ color: "rgba(190,157,255,0.4)" }}>[step {index + 1}]</span>{" "}
        <span style={{ color: "#be9dff", fontWeight: 600 }}>[Executor]</span>{" "}
        <span style={{ display: "block", maxWidth: "100%", overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
          {clipped}
        </span>
      </div>
    )
  }

  return (
    <section ref={sectionRef} className="snap-section" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "5.25rem 2.5rem", width: "100%" }}>
        <div className="section-eyebrow dawn-reveal dawn-delay-1">Live Execution</div>
        <h2 className="dawn-reveal dawn-delay-2" style={{ fontFamily: "Manrope,sans-serif", fontSize: "clamp(2rem,3.8vw,2.9rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.65rem" }}>
          Execution Map
        </h2>
        <p className="dawn-reveal dawn-delay-3" style={{ color: "rgba(238,228,252,0.45)", marginBottom: "3rem", fontSize: "1.05rem", maxWidth: 720, lineHeight: 1.75 }}>
          Real-time orchestration across planner, executor, validator, and delivery stages
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1.18fr 0.82fr", gap: "1.5rem", alignItems: "start" }}>
          <div className="liquid-glass feature-card dawn-reveal-scale dawn-delay-4 dashboard-lift-card" style={{ gridColumn: "span 2", padding: "2rem", borderRadius: 20, minWidth: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", gap: "1rem", flexWrap: "wrap", minWidth: 0 }}>
              <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: "0.98rem", display: "block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {latestRun?.task || "Workflow Plan -> Execute -> Validate -> Deliver"}
              </span>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.28rem 0.85rem", background: "rgba(190,157,255,0.08)", border: "1px solid rgba(190,157,255,0.2)", borderRadius: 999, fontSize: "0.68rem", fontWeight: 600, color: "#be9dff", letterSpacing: "0.06em" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: latestRun ? "#4ade80" : "#be9dff", animation: latestRun ? "none" : "pulse 2s infinite" }} />
                {latestRun ? (isFallback ? "FALLBACK" : isLocal ? "LOCAL" : isManaged ? "FLOW" : "COMPLETED") : "LIVE"}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", padding: "0.8rem 1.1rem" }}>
              {nodeLabels.map((label, i) => {
                const active = latestRun ? i <= Math.min(processed, nodeLabels.length - 1) : i < 2
                return (
                  <div key={label} style={{ display: "contents" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.65rem", zIndex: 1, opacity: active ? 1 : 0.35 }}>
                      <div style={{
                        width: 58, height: 58, borderRadius: 16,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: active ? "rgba(190,157,255,0.08)" : "rgba(41,34,58,0.5)",
                        border: `1px solid ${active ? "rgba(190,157,255,0.3)" : "rgba(190,157,255,0.08)"}`,
                        boxShadow: active ? "0 0 18px rgba(190,157,255,0.12)" : "none",
                        transition: "all 0.3s",
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 24, color: active ? "#be9dff" : "rgba(238,228,252,0.3)" }}>
                          {["search", "psychology", "summarize", "mail"][i]}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: active ? "rgba(238,228,252,0.6)" : "rgba(238,228,252,0.25)" }}>
                        {label}
                      </span>
                    </div>
                    {i < nodeLabels.length - 1 && <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(190,157,255,0.3), rgba(190,157,255,0.06))", position: "relative", overflow: "hidden" }} className={active ? "node-flow" : ""} />}
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: "1.75rem", padding: "0.95rem 1.15rem", background: "rgba(190,157,255,0.04)", border: "1px solid rgba(190,157,255,0.1)", borderRadius: 12, display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#be9dff", animation: "pulse 2s infinite" }} />
              <span style={{ fontFamily: "monospace", fontSize: "0.76rem", color: "rgba(238,228,252,0.5)" }}>
                AGENT: {latestRun ? (latestRun.message || `Completed ${latestRun.output.processed} step(s) for ${latestRun.name}`) : "Building workflow graph and preparing execution..."}
              </span>
            </div>
          </div>

          <div className="liquid-glass feature-card dawn-reveal dawn-delay-5 dashboard-lift-card" style={{ padding: "1.75rem", borderRadius: 20, minWidth: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.15rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 17, color: "rgba(238,228,252,0.3)" }}>terminal</span>
                <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: "0.95rem" }}>Process Logs</span>
              </div>
              <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "rgba(238,228,252,0.3)" }}>{latestRun?.id || "WKF-8821-X"}</span>
            </div>
            <div className="terminal-text modern-scrollbar process-log-scroll" style={{ background: "rgba(8,6,14,0.6)", borderRadius: 12, padding: "1rem", maxHeight: 220, overflowY: "auto", overflowX: "hidden", border: "1px solid rgba(190,157,255,0.06)", fontSize: "0.76rem", lineHeight: 1.7, minWidth: 0, maxWidth: "100%" }}>
              {(latestRun?.output.results || []).slice(0, 5).map((result, i) => renderLogEntry(result, i))}
              {!latestRun && <div style={{ color: "rgba(238,228,252,0.45)" }}>[09:41:05] [Planner] Analyzing request...</div>}
            </div>
          </div>

          <div className="liquid-glass feature-card dawn-reveal dawn-delay-6 dashboard-lift-card" style={{ padding: "1.75rem", borderRadius: 20, minWidth: 0, overflow: "hidden" }}>
            <div style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: "0.95rem", marginBottom: "1.65rem" }}>Workflow Progress</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative" }}>
              <div style={{ position: "absolute", left: 13, top: 0, bottom: 0, width: 1, background: "rgba(190,157,255,0.08)" }} />
              {steps.map(s => {
                const st = stateStyles[s.state]
                return (
                  <div key={s.label} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", position: "relative" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: st.bg, border: `1px solid ${st.border}`, position: "relative", zIndex: 1 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: st.color, animation: s.state === "active" ? "spin 1.5s linear infinite" : "none" }}>{s.icon}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.92rem", fontWeight: 500, color: s.state === "pending" ? "rgba(238,228,252,0.4)" : "#eee4fc" }}>{s.label}</div>
                      <div style={{ fontSize: "0.76rem", color: st.color, marginTop: 3, lineHeight: 1.6 }}>{s.sub}</div>
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
