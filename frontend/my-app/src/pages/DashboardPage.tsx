import { useState } from "react"
import HeroInputSection from "../components/HeroInputSection"
import ExecutionSection from "../components/ExecutionSection"
import ReasoningSection from "../components/ReasoningSection"
import TemplatesSection from "../components/TemplatesSection"
import AgentPage from "../components/AgentPage"
import WorkflowsPage from "../components/WorkflowsPage.tsx"
import LogsPage from "../components/LogsPage.tsx"
import { SettingsPanel, NotificationsPanel } from "../components/Panels.tsx"

type NavTab = "dashboard" | "workflows" | "logs"
type SidebarAgent = "Web Search" | "Python Executor" | "Email Sender" | "Database" | "History"

const agents: { icon: string; label: SidebarAgent }[] = [
  { icon: "language", label: "Web Search" },
  { icon: "terminal", label: "Python Executor" },
  { icon: "mail", label: "Email Sender" },
  { icon: "database", label: "Database" },
  { icon: "history", label: "History" },
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard")
  const [activeAgent, setActiveAgent] = useState<SidebarAgent | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [workflowInput, setWorkflowInput] = useState("")

  const isDashboard = activeTab === "dashboard" && activeAgent === null

  return (
    <>
      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: "56px",
        background: "rgba(16,11,28,0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(190,157,255,0.08)",
      }}>
        <div style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: "0.9375rem", letterSpacing: "0.08em", color: "#eee4fc" }}>
          FLOW
        </div>

        {/* Nav tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {(["dashboard", "workflows", "logs"] as NavTab[]).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setActiveAgent(null) }} style={{
              border: "none",
              cursor: "pointer",
              padding: "0.375rem 1rem",
              borderRadius: 8,
              fontFamily: "Manrope,sans-serif",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: activeTab === tab ? "#eee4fc" : "rgba(238,228,252,0.4)",
              background: activeTab === tab 
                ? "rgba(190,157,255,0.08)" 
                : "none",
              transition: "all 0.2s",
              textTransform: "capitalize",
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Right icons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ position: "relative" }}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "rgba(238,228,252,0.3)" }}>search</span>
            <input placeholder="Search workflows..." style={{ background: "rgba(41,34,58,0.5)", border: "1px solid rgba(190,157,255,0.12)", borderRadius: 8, padding: "0.375rem 0.75rem 0.375rem 2rem", fontSize: "0.75rem", color: "#eee4fc", outline: "none", fontFamily: "Inter,sans-serif", width: 180 }} />
          </div>

          {/* Notification bell */}
          <button onClick={() => { setShowNotifications(true); setShowSettings(false) }} style={{ position: "relative", background: "none", border: "none", color: showNotifications ? "#be9dff" : "rgba(238,228,252,0.4)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center", borderRadius: 8, transition: "color 0.2s" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications</span>
            <div style={{ position: "absolute", top: 2, right: 2, width: 7, height: 7, borderRadius: "50%", background: "#ef4444", border: "1.5px solid #100b1c" }} />
          </button>

          {/* Settings gear */}
          <button onClick={() => { setShowSettings(true); setShowNotifications(false) }} style={{ background: "none", border: "none", color: showSettings ? "#be9dff" : "rgba(238,228,252,0.4)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center", borderRadius: 8, transition: "color 0.2s" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>settings</span>
          </button>

          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(190,157,255,0.15)", border: "1px solid rgba(190,157,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 700, color: "#be9dff", cursor: "pointer" }}>
            RK
          </div>
        </div>
      </nav>

      {/* ── SIDEBAR ── */}
      <aside style={{ position: "fixed", left: 0, top: 56, bottom: 0, width: 220, background: "#100b1c", borderRight: "1px solid rgba(190,157,255,0.08)", display: "flex", flexDirection: "column", zIndex: 50 }}>
        {/* Status */}
        <div style={{ padding: "1.25rem", borderBottom: "1px solid rgba(190,157,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.875rem", background: "rgba(41,34,58,0.5)", borderRadius: 10, border: "1px solid rgba(190,157,255,0.1)" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite" }} />
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#eee4fc", fontFamily: "Manrope,sans-serif" }}>Automation Hub</div>
              <div style={{ fontSize: "0.625rem", color: "rgba(238,228,252,0.35)" }}>System Active</div>
            </div>
          </div>
        </div>

        {/* Section label */}
        <div style={{ padding: "1rem 1.25rem 0.375rem", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(238,228,252,0.25)", fontFamily: "Manrope,sans-serif" }}>
          Agents
        </div>

        {/* Agent nav */}
        <nav style={{ flex: 1 }}>
          {/* Dashboard home link */}
          <a
            href="#"
            onClick={e => { e.preventDefault(); setActiveAgent(null); setActiveTab("dashboard") }}
            className={`sidebar-item${isDashboard ? " active" : ""}`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </a>

          {agents.map(a => (
            <a
              key={a.label}
              href="#"
              onClick={e => { e.preventDefault(); setActiveAgent(a.label); setActiveTab("dashboard") }}
              className={`sidebar-item${activeAgent === a.label ? " active" : ""}`}
            >
              <span className="material-symbols-outlined">{a.icon}</span>
              {a.label}
              {a.label === "Web Search" && (
                <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite" }} />
              )}
            </a>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "1.25rem", borderTop: "1px solid rgba(190,157,255,0.08)" }}>
          <button className="btn-primary" style={{ width: "100%", justifyContent: "center", borderRadius: 10, padding: "0.625rem 1rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> New Workflow
          </button>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            {[["help", "Docs"], ["contact_support", "Support"]].map(([icon, label]) => (
              <a key={label} href="#" style={{ color: "rgba(238,228,252,0.3)", fontSize: "0.75rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontFamily: "Manrope,sans-serif" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>{label}
              </a>
            ))}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{ marginLeft: 220, paddingTop: 56 }}>
        {/* Workflows tab */}
        {activeTab === "workflows" && <WorkflowsPage />}

        {/* Logs tab */}
        {activeTab === "logs" && <LogsPage />}

        {/* Dashboard tab — agent page or main sections */}
        {activeTab === "dashboard" && activeAgent && <AgentPage agent={activeAgent} />}

        {/* Dashboard tab — main scroll sections */}
        {isDashboard && (
          <>
            <HeroInputSection inputValue={workflowInput} onInputChange={setWorkflowInput} />
            <ExecutionSection />
            <ReasoningSection />
            <TemplatesSection onUseTemplate={(prompt) => { setWorkflowInput(prompt); setActiveTab("dashboard"); setActiveAgent(null) }} />
          </>
        )}
      </div>

      {/* ── SLIDE-IN PANELS ── */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
    </>
  )
}
