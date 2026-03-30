import { useEffect, useRef } from "react"
import type { LatestRun } from "../services/agentApi"

interface Props {
  latestRun: LatestRun | null
  onDownloadJson?: () => void
}

export default function ReasoningSectionConnected({ latestRun, onDownloadJson }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const metricCards = [
    { key: "papersFound" as const, label: "Planned Steps", color: "#eee4fc", fallback: 4 },
    { key: "processed" as const, label: "Executed Steps", color: "#4ade80", fallback: 2 },
  ]
  const previewItems = (latestRun?.output.results || []).slice(0, 3)
  const hasFallbackMessage = latestRun?.output.abstract.toLowerCase().includes("fallback") ?? false

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add("reveal-visible")),
      { threshold: 0.1 }
    )
    sectionRef.current?.querySelectorAll(".reveal-hidden, .reveal-hidden-left").forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const reasoning = latestRun?.reasoning || [
    { tag: "Planning", text: "The planner decomposes the request into executable tool actions and prepares the workflow chain." },
    { tag: "Validation", text: "The validator checks each execution step before the workflow is marked complete." },
  ]

  return (
    <section ref={sectionRef} className="snap-section" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "5rem 2rem", width: "100%" }}>
        <div className="section-eyebrow reveal-hidden">Agent Intelligence</div>
        <h2 className="reveal-hidden" style={{ fontFamily: "Manrope,sans-serif", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
          Reasoning &amp; Output
        </h2>
        <p className="reveal-hidden" style={{ color: "rgba(238,228,252,0.45)", marginBottom: "2.5rem", fontSize: "0.9375rem" }}>
          Live planner, executor, validator, and final workflow output
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div className="liquid-glass feature-card reveal-hidden-left" style={{ padding: "1.75rem", borderRadius: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 17, color: "rgba(190,157,255,0.5)" }}>lightbulb</span>
              <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: "0.875rem" }}>Agent Reasoning</span>
              <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.15rem 0.625rem", background: "rgba(190,157,255,0.08)", border: "1px solid rgba(190,157,255,0.15)", borderRadius: 999, fontSize: "0.5625rem", fontWeight: 600, color: "rgba(190,157,255,0.7)", letterSpacing: "0.06em" }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#be9dff", animation: "pulse 2s infinite" }} /> LIVE
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {reasoning.map(item => (
                <div key={item.tag} style={{ padding: "1rem", background: "rgba(41,34,58,0.5)", borderRadius: 10, borderLeft: "2px solid rgba(190,157,255,0.4)" }}>
                  <div style={{ fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(238,228,252,0.3)", marginBottom: "0.375rem" }}>{item.tag}</div>
                  <p style={{ fontSize: "0.8125rem", color: "rgba(238,228,252,0.55)", lineHeight: 1.65 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="liquid-glass feature-card reveal-hidden-left" style={{ padding: "1.75rem", borderRadius: 16, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 17, color: "rgba(190,157,255,0.5)" }}>description</span>
              <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: "0.875rem" }}>Workflow Output</span>
            </div>

            <div style={{ flex: 1, background: "rgba(41,34,58,0.5)", borderRadius: 10, padding: "1.25rem", marginBottom: "1.25rem", border: "1px solid rgba(190,157,255,0.08)" }}>
              <div style={{ fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(238,228,252,0.3)", marginBottom: "0.625rem" }}>Execution Summary</div>
              <p style={{ fontSize: "0.8125rem", color: "rgba(238,228,252,0.55)", lineHeight: 1.7, fontStyle: "italic" }}>
                {latestRun?.output.abstract || "The workflow engine will surface the final execution summary here after a run completes."}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {metricCards.map(card => (
                <div key={card.label} style={{ background: "rgba(41,34,58,0.5)", borderRadius: 10, padding: "0.875rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.375rem", fontWeight: 700, color: card.color, fontFamily: "Manrope,sans-serif" }}>{latestRun ? latestRun.output[card.key] : card.fallback}</div>
                  <div style={{ fontSize: "0.6875rem", color: "rgba(238,228,252,0.35)", marginTop: 2 }}>{card.label}</div>
                </div>
              ))}
            </div>

            <button className="btn-glass" style={{ justifyContent: "center", borderRadius: 10 }} onClick={onDownloadJson}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span> Download JSON
            </button>
          </div>
        </div>

        <div className="liquid-glass feature-card reveal-hidden-left" style={{ padding: "1.75rem", borderRadius: 16, marginTop: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 17, color: "rgba(190,157,255,0.5)" }}>task_alt</span>
              <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: "0.875rem" }}>Final Output</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.2rem 0.75rem", background: latestRun ? "rgba(74,222,128,0.08)" : "rgba(190,157,255,0.08)", border: `1px solid ${latestRun ? "rgba(74,222,128,0.2)" : "rgba(190,157,255,0.15)"}`, borderRadius: 999, fontSize: "0.625rem", fontWeight: 600, color: latestRun ? "#4ade80" : "#be9dff", letterSpacing: "0.06em" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: latestRun ? "#4ade80" : "#be9dff", animation: latestRun ? "none" : "pulse 2s infinite" }} />
                {latestRun ? latestRun.status.toUpperCase() : "WAITING"}
              </div>
              <div style={{ padding: "0.2rem 0.75rem", background: "rgba(41,34,58,0.5)", border: "1px solid rgba(190,157,255,0.1)", borderRadius: 999, fontSize: "0.625rem", fontWeight: 600, color: "rgba(238,228,252,0.45)", letterSpacing: "0.06em" }}>
                {latestRun?.id || "No run yet"}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "1rem", alignItems: "start" }}>
            <div style={{ background: "rgba(41,34,58,0.5)", borderRadius: 12, padding: "1.25rem", border: "1px solid rgba(190,157,255,0.08)", minHeight: 220 }}>
              <div style={{ fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(238,228,252,0.3)", marginBottom: "0.625rem" }}>Run Summary</div>
              <div style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: "0.9375rem", color: "#eee4fc", marginBottom: "0.5rem" }}>
                {latestRun?.name || "Workflow output will appear here after a run"}
              </div>
              <p style={{ fontSize: "0.8125rem", color: "rgba(238,228,252,0.55)", lineHeight: 1.7, marginBottom: hasFallbackMessage ? "1rem" : 0 }}>
                {latestRun?.task || "Run a workflow from the hero input to populate this final output card."}
              </p>
              {hasFallbackMessage && (
                <div style={{ marginTop: "1rem", padding: "0.875rem 1rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 10, color: "#f59e0b", fontSize: "0.75rem", lineHeight: 1.6 }}>
                  {latestRun?.message || "This run used fallback execution."}
                </div>
              )}
            </div>

            <div style={{ background: "rgba(41,34,58,0.5)", borderRadius: 12, padding: "1.25rem", border: "1px solid rgba(190,157,255,0.08)", maxHeight: 640, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(238,228,252,0.3)", marginBottom: "0.75rem" }}>Execution Artifacts</div>
              <div className="modern-scrollbar artifact-scroll-shell" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto", paddingRight: "0.375rem" }}>
                {previewItems.length > 0 ? previewItems.map((item, index) => (
                  <div key={index} style={{ padding: "0.875rem", background: "rgba(8,6,14,0.45)", borderRadius: 10, border: "1px solid rgba(190,157,255,0.06)" }}>
                    <div style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#be9dff", marginBottom: "0.375rem" }}>
                      Artifact {index + 1}
                    </div>
                    <div className="modern-scrollbar artifact-scroll-body" style={{ fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(238,228,252,0.6)", lineHeight: 1.7, wordBreak: "break-word", maxHeight: 180, overflowY: "auto", whiteSpace: "pre-wrap", paddingRight: "0.25rem" }}>
                      {JSON.stringify(item, null, 2)}
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: "0.875rem", background: "rgba(8,6,14,0.45)", borderRadius: 10, border: "1px solid rgba(190,157,255,0.06)", fontSize: "0.75rem", color: "rgba(238,228,252,0.4)", lineHeight: 1.7 }}>
                    No execution artifacts yet. Once you run a workflow, the planner and executor outputs will appear here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
