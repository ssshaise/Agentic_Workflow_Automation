import { useNavigate } from "react-router-dom"

export default function Navbar() {
  const navigate = useNavigate()
  const itemActions: Record<string, () => void> = {
    Product: () => window.scrollTo({ top: window.innerHeight, behavior: "smooth" }),
    Features: () => window.scrollTo({ top: window.innerHeight * 2, behavior: "smooth" }),
    Architecture: () => window.scrollTo({ top: window.innerHeight * 3, behavior: "smooth" }),
    Docs: () => window.open("https://platform.openai.com/docs", "_blank", "noopener,noreferrer"),
  }

  return (
    <nav>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.25rem 2rem" }}>
        <div style={{ fontFamily:"Manrope,sans-serif", fontSize:"1.125rem", fontWeight:800, letterSpacing:"0.05em" }}>FLOW</div>
        <div style={{ display:"flex", alignItems:"center", gap:"2rem" }}>
          {["Product","Features","Architecture","Docs"].map(item => (
            <button key={item} onClick={itemActions[item]} style={{ background:"none", border:"none", color:"rgba(238,228,252,0.8)", fontFamily:"Inter,sans-serif", fontSize:"0.9375rem", cursor:"pointer" }}>
              {item}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => navigate("/dashboard")}>Get Started</button>
      </div>
      <div className="nav-divider" />
    </nav>
  )
}
