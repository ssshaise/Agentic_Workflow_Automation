export default function Navbar() {
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
        <button className="btn-primary">Get Started</button>
      </div>
      <div className="nav-divider" />
    </nav>
  )
}