/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#be9dff",
        "primary-dim": "#8c49ff",
        background: "#100b1c",
        surface: "#100b1c",
        "surface-container": "#1c162a",
        "surface-variant": "#29223a",
        "on-surface": "#eee4fc",
        "on-surface-variant": "#b0a7be",
        "outline-variant": "#4b4558",
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      animation: {
        marquee: "marquee 30s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
}