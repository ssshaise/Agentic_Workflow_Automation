import { useEffect, useRef } from "react"

interface StatusChip {
  label: string
  dot: string | null
}

interface Props {
  inputValue?: string
  onInputChange?: (val: string) => void
  onRunWorkflow?: () => void
  onScheduleWorkflow?: () => void
  onAttachFile?: (file: File | null) => void
  statusChips?: StatusChip[]
  isBusy?: boolean
}

export default function HeroInputSectionConnected({
  inputValue = "",
  onInputChange,
  onRunWorkflow,
  onScheduleWorkflow,
  onAttachFile,
  statusChips,
  isBusy = false,
}: Props) {
  const refs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLHeadingElement>(null),
    useRef<HTMLParagraphElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ]
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const delays = [0, 100, 200, 350, 500]
    refs.forEach((ref, i) => {
      setTimeout(() => ref.current?.classList.add("reveal-visible"), delays[i])
    })
  }, [])

  const chips = statusChips || [
    { label: "3 agents active", dot: "#4ade80" },
    { label: "WKF-8821-X running", dot: "#be9dff" },
    { label: "12 workflows today", dot: null },
  ]

  return (
    <section className="snap-section" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "5rem 2rem", width: "100%" }}>
        <div style={{ maxWidth: 600 }}>
          <div ref={refs[0]} className="section-eyebrow reveal-hidden">Agentic Workflow Engine</div>

          <h1 ref={refs[1]} className="reveal-hidden" style={{
            fontFamily: "Manrope,sans-serif",
            fontSize: "clamp(2rem,4.5vw,3.25rem)",
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: "-0.025em",
            color: "#eee4fc",
            marginBottom: "1.25rem",
          }}>
            Automate the<br />Unthinkable.
          </h1>

          <p ref={refs[2]} className="reveal-hidden" style={{ color: "rgba(238,228,252,0.55)", fontSize: "1rem", lineHeight: 1.75, maxWidth: 480, marginBottom: "2.5rem" }}>
            Deploy agentic workflows that browse, reason, and execute tasks across the web with precision and zero manual effort.
          </p>

          <div ref={refs[3]} className="reveal-hidden liquid-glass" style={{ borderRadius: 16, overflow: "hidden", marginBottom: "1.25rem" }}>
            <textarea
              value={inputValue}
              onChange={e => onInputChange?.(e.target.value)}
              placeholder="Monitor arxiv papers -> summarize -> send email"
              rows={2}
              style={{
                width: "100%", background: "none", border: "none", outline: "none",
                color: "#eee4fc", fontFamily: "Inter,sans-serif",
                fontSize: "0.9375rem", resize: "none", padding: "1rem 1.25rem",
              }}
            />
            <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={e => onAttachFile?.(e.target.files?.[0] || null)} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderTop: "1px solid rgba(190,157,255,0.08)" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn-glass" style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", borderRadius: 8 }} onClick={() => fileInputRef.current?.click()}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>attach_file</span>Attach
                </button>
                <button className="btn-glass" style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", borderRadius: 8 }} onClick={onScheduleWorkflow}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>Schedule
                </button>
              </div>
              <button className="btn-primary" style={{ borderRadius: 10, padding: "0.5rem 1.25rem", opacity: isBusy ? 0.85 : 1 }} onClick={onRunWorkflow}>
                {isBusy ? "Running..." : "Run Workflow"} <span className="material-symbols-outlined" style={{ fontSize: 15 }}>bolt</span>
              </button>
            </div>
          </div>

          <div ref={refs[4]} className="reveal-hidden" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {chips.map(c => (
              <div key={c.label} style={{
                display: "inline-flex", alignItems: "center", gap: "0.375rem",
                padding: "0.25rem 0.875rem",
                background: "rgba(41,34,58,0.5)",
                border: "1px solid rgba(190,157,255,0.12)",
                borderRadius: 999, fontSize: "0.6875rem", fontWeight: 500,
                color: "rgba(238,228,252,0.55)",
              }}>
                {c.dot && <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, animation: "pulse 2s infinite" }} />}
                {c.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
