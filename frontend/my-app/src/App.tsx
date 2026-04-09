import type { ReactElement } from "react"
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import DashboardPageConnected from "./pages/DashboardPageConnected"
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignupPage"
import VerifyEmailPage from "./pages/VerifyEmailPage"
import { hasAuthSession } from "./services/authStorage"
import "./index.css"

function ProtectedRoute({ children }: { children: ReactElement }) {
  return hasAuthSession() ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }: { children: ReactElement }) {
  return hasAuthSession() ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
        <Route path="/verify-email" element={<ProtectedRoute><VerifyEmailPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPageConnected /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
