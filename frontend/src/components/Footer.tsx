export default function Footer() {
  const links = ["Privacy Policy", "Terms of Service", "Security", "Status"]

  return (
    <footer style={{ background: "rgba(16,11,28,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", width: "100%", padding: "3rem 2rem", borderTop: "1px solid rgba(190,157,255,0.06)" }}>
      <div style={{ maxWidth: "80rem", margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", fontFamily: "Manrope,sans-serif", fontSize: "0.875rem" }}>

        {/* Brand */}
        <div>
          <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#eee4fc", marginBottom: "0.25rem" }}>FLOW</div>
          <p style={{ color: "rgba(238,228,252,0.4)", margin: 0 }}>© 2026 Flow. All rights reserved.</p>
        </div>

        {/* Links */}
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          {links.map((link) => (
            <a
              key={link}
              href="#"
              style={{ color: "rgba(238,228,252,0.5)", textDecoration: "none", transition: "color 0.2s" }}
              onMouseOver={e => (e.currentTarget.style.color = "#be9dff")}
              onMouseOut={e => (e.currentTarget.style.color = "rgba(238,228,252,0.5)")}
            >
              {link}
            </a>
          ))}
        </div>

        {/* Social icons */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {["share", "alternate_email"].map((icon) => (
            <a
              key={icon}
              href="#"
              className="liquid-glass"
              style={{ width: "2.5rem", height: "2.5rem", borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center", color: "#eee4fc", textDecoration: "none", transition: "color 0.2s" }}
              onMouseOver={e => (e.currentTarget.style.color = "#be9dff")}
              onMouseOut={e => (e.currentTarget.style.color = "#eee4fc")}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>{icon}</span>
            </a>
          ))}
        </div>

      </div>
    </footer>
  )
}
