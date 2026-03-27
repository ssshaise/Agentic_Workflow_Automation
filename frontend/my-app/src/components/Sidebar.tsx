const agents = [
  { icon: "language", label: "Web Search", active: true, live: true },
  { icon: "terminal", label: "Python Executor" },
  { icon: "mail", label: "Email Sender" },
  { icon: "database", label: "Database" },
  { icon: "history", label: "History" },
]

export default function Sidebar() {
  return (
    <aside style={{
      position: "fixed", left: 0, top: 56, bottom: 0, width: 220,
      background: "#100b1c",
      borderRight: "1px solid rgba(190,157,255,0.08)",
      display: "flex", flexDirection: "column",
      zIndex: 50,
    }}>
      {/* Status */}
      <div style={{ padding: "1.25rem", borderBottom: "1px solid rgba(190,157,255,0.08)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.625rem",
          padding: "0.625rem 0.875rem",
          background: "rgba(41,34,58,0.5)",
          borderRadius: 10,
          border: "1px solid rgba(190,157,255,0.1)",
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite" }} />
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#eee4fc", fontFamily: "Manrope,sans-serif" }}>Automation Hub</div>
            <div style={{ fontSize: "0.625rem", color: "rgba(238,228,252,0.35)" }}>System Active</div>
          </div>
        </div>
      </div>

      {/* Section label */}
      <div style={{ padding: "1rem 1.25rem 0.375rem", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(238,228,252,0.25)", fontFamily: "Manrope,sans-serif" }}>
        Agents
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1 }}>
        {agents.map(a => (
          <a key={a.label} href="#" className={`sidebar-item${a.active ? " active" : ""}`}>
            <span className="material-symbols-outlined">{a.icon}</span>
            {a.label}
            {a.live && (
              <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite" }} />
            )}
          </a>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "1.25rem", borderTop: "1px solid rgba(190,157,255,0.08)" }}>
        <button className="btn-primary" style={{ width: "100%", justifyContent: "center", borderRadius: 10, padding: "0.625rem 1rem" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> New Workflow
        </button>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          {["help:Docs", "contact_support:Support"].map(s => {
            const [icon, label] = s.split(":")
            return (
              <a key={label} href="#" style={{ color: "rgba(238,228,252,0.3)", fontSize: "0.75rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontFamily: "Manrope,sans-serif" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>{label}
              </a>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
