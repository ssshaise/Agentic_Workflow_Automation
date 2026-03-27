import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "./Navbar"

export default function HeroSection() {
  const navRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtextRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTimeout(() => {
      navRef.current?.style && (navRef.current.style.opacity = "1", navRef.current.style.transform = "translateY(0)")
    }, 300)
    setTimeout(() => titleRef.current?.classList.add("reveal-visible"), 600)
    setTimeout(() => subtextRef.current?.classList.add("reveal-visible"), 800)
    setTimeout(() => ctaRef.current?.classList.add("reveal-visible"), 1000)
  }, [])

  return (
    <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", position:"relative" }}>
      <span ref={navRef as any} style={{ opacity:0, transform:"translateY(-20px)", transition:"opacity 0.6s ease, transform 0.6s ease" }}>
        <Navbar />
      </span>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"5rem 1rem 2rem", textAlign:"center" }}>
        <h1 ref={titleRef} className="reveal-hidden hero-gradient-text"
          style={{ fontFamily:"Manrope,sans-serif", fontSize:"clamp(80px,16vw,200px)", fontWeight:400, lineHeight:1.02, letterSpacing:"-0.024em", margin:0 }}>
          Flow
        </h1>
        <p ref={subtextRef} className="reveal-hidden"
          style={{ color:"rgba(238,228,252,0.7)", fontFamily:"Inter,sans-serif", fontSize:"1.125rem", lineHeight:2, maxWidth:"26rem", marginTop:"1rem" }}>
          Autonomous Agentic Workflow<br />Automation Platform
        </p>
        <div ref={ctaRef} className="reveal-hidden" style={{ marginTop:"2rem" }}>
          <button className="btn-glass" onClick={() => navigate('/dashboard')}>Connect</button>
        </div>
      </div>
    </section>  
  )
}