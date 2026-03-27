const brands = ["Nimbus","Prysma","Cirrus","Kynder","Halcyn","Vortex"]

export default function MarqueeSection() {
  const allBrands = [...brands, ...brands]
  return (
    <section style={{ width:"100%", overflow:"hidden", padding:"0 0 3rem" }}>
      <div style={{ maxWidth:"72rem", margin:"0 auto", padding:"0 2rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"3rem", overflow:"hidden" }}>
          <div style={{ flexShrink:0, color:"rgba(238,228,252,0.5)", fontSize:"0.75rem", fontFamily:"Manrope,sans-serif", lineHeight:1.6, whiteSpace:"nowrap", textTransform:"uppercase", letterSpacing:"0.04em" }}>
            Relied on by brands<br />across the globe
          </div>
          <div style={{ overflow:"hidden", flex:1 }}>
            <div className="marquee-track">
              {allBrands.map((brand, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.75rem", flexShrink:0 }}>
                  <div className="liquid-glass" style={{ width:"1.5rem", height:"1.5rem", borderRadius:"6px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", fontWeight:700 }}>
                    {brand[0]}
                  </div>
                  <span style={{ fontFamily:"Manrope,sans-serif", fontWeight:600 }}>{brand}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}