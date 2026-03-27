import BgVideo from "../components/BgVideo"
import HeroSection from "../components/HeroSection"
import MarqueeSection from "../components/MarqueeSection"
import WhyFlowSection from "../components/WhyFlowSection"
import BentoSection from "../components/BentoSection"
import MissionSection from "../components/MissionSection"
import Footer from "../components/Footer"

export default function LandingPage() {
  return (
    <>
      <BgVideo />
      <HeroSection />
      <MarqueeSection />
      <WhyFlowSection />
      <BentoSection />
      <MissionSection />
      <Footer />
    </>
  )
}