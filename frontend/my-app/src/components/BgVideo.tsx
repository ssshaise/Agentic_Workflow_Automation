import { useEffect, useRef } from "react"

export default function BgVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  
  useEffect(() => {
  const v = videoRef.current
  if (!v) return
  const FADE = 1.2
  let fading = false

  const onPlay = () => {
    v.style.transition = `opacity ${FADE}s ease`
    v.style.opacity = "0.35"
  }
  const onTimeUpdate = () => {
    if (!v.duration) return
    const remaining = v.duration - v.currentTime
    if (remaining <= FADE && !fading) {
      fading = true
      v.style.transition = `opacity ${FADE}s ease`
      v.style.opacity = "0"
    }
  }
  const onEnded = () => {
    v.currentTime = 0
    v.play()
    fading = false
    v.style.transition = `opacity ${FADE}s ease`
    v.style.opacity = "0.35"
  }

  v.addEventListener("play", onPlay, { once: true })
  v.addEventListener("timeupdate", onTimeUpdate)
  v.addEventListener("ended", onEnded)
  return () => {
    v.removeEventListener("timeupdate", onTimeUpdate)
    v.removeEventListener("ended", onEnded)
  }
}, [])

  return (
    <div id="bg-video-container">
      <video ref={videoRef} id="bg-video" autoPlay muted playsInline style={{ opacity: 0 }}>
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay" />
    </div>
  )
}