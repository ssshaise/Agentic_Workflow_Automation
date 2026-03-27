export default function DashNav() {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 2rem", height: "56px",
      background: "rgba(16,11,28,0.85)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    }}>
      <div style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: "0.9375rem", letterSpacing: "0.08em", color: "#eee4fc" }}>
        FLOW
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        {["Dashboard", "Workflows", "Logs"].map((item, i) => (
          <a key={item} href="#" style={{
            color: i === 0 ? "#be9dff" : "rgba(238,228,252,0.55)",
            textDecoration: "none", fontSize: "0.8125rem", fontWeight: 500,
            fontFamily: "Manrope,sans-serif",
            borderBottom: i === 0 ? "1px solid rgba(190,157,255,0.4)" : "none",
            paddingBottom: i === 0 ? "2px" : "0",
            transition: "color 0.2s",
          }}>{item}</a>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ position: "relative" }}>
          <span className="material-symbols-outlined" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "rgba(238,228,252,0.3)" }}>search</span>
          <input placeholder="Search workflows..." style={{
            background: "rgba(41,34,58,0.5)", border: "1px solid rgba(190,157,255,0.12)",
            borderRadius: "8px", padding: "0.375rem 0.75rem 0.375rem 2rem",
            fontSize: "0.75rem", color: "#eee4fc", outline: "none",
            fontFamily: "Inter,sans-serif", width: 180,
          }} />
        </div>
        {["notifications", "settings"].map(icon => (
          <button key={icon} style={{ background: "none", border: "none", color: "rgba(238,228,252,0.4)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center", borderRadius: 8, transition: "color 0.2s" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 19 }}>{icon}</span>
          </button>
        ))}
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(190,157,255,0.15)", border: "1px solid rgba(190,157,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 700, color: "#be9dff", cursor: "pointer" }}>
          RK
        </div>
      </div>
      <div className="nav-divider" style={{ position: "absolute", bottom: 0, left: 0, right: 0 }} />
    </nav>
  )
}
