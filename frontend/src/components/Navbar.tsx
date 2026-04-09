import { useNavigate } from "react-router-dom"

export default function Navbar() {
  const navigate = useNavigate()
  return (
    <nav>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.25rem 2rem" }}>
        <div style={{ fontFamily:"Manrope,sans-serif", fontSize:"1.125rem", fontWeight:800, letterSpacing:"0.05em" }}>FLOW</div>
        <div style={{ display:"flex", alignItems:"center", gap:"2rem" }}>
          {["Product","Features","Architecture","Docs"].map(item => (
            <button key={item} style={{ background:"none", border:"none", color:"rgba(238,228,252,0.8)", fontFamily:"Inter,sans-serif", fontSize:"0.9375rem", cursor:"pointer" }}>
              {item}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "rgba(41,34,58,0.4)",
              color: "#eee4fc",
              fontFamily: "Manrope,sans-serif",
              fontWeight: 700,
              borderRadius: 9999,
              padding: "0.625rem 1.1rem",
              fontSize: "0.875rem",
              cursor: "pointer",
              border: "1px solid rgba(190,157,255,0.12)",
            }}
          >
            Sign In
          </button>
          <button className="btn-primary" onClick={() => navigate("/signup")}>Get Started</button>
        </div>
      </div>
      <div className="nav-divider" />
    </nav>
  )
}
