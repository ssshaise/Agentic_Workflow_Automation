import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import DashboardPageConnected from "./pages/DashboardPageConnected"
import "./index.css"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPageConnected />} />
      </Routes>
    </BrowserRouter>
  )
}
