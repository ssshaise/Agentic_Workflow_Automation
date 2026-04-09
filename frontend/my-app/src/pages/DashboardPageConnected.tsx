import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import HeroInputSectionConnected from "../components/HeroInputSectionConnected"
import ExecutionSectionConnected from "../components/ExecutionSectionConnected"
import ReasoningSectionConnected from "../components/ReasoningSectionConnected"
import TemplatesSection from "../components/TemplatesSection"
import DashboardAmbientBackground from "../components/DashboardAmbientBackground"
import AgentPageConnected from "../components/AgentPageConnected"
import WorkflowsPageConnected from "../components/WorkflowsPageConnected"
import LogsPageConnected from "../components/LogsPageConnected"
import { NotificationsPanelConnected, SettingsPanelConnected } from "../components/PanelsConnected"
import {
  clearLogs,
  cloneHistoryRun,
  createWorkflow,
  deleteWorkflow,
  getRun,
  getDashboardSnapshot,
  queueAgentWorkflow,
  replayHistoryRun,
  replayWorkflow,
  saveSettings,
  toggleWorkflow,
  logout,
  type DashboardSettings,
  type LatestRun,
  type LogItem,
  type NotificationItem,
  type WorkflowItem,
  type WorkflowStats,
} from "../services/agentApi"
import { getStoredAuthUser } from "../services/authStorage"

type NavTab = "dashboard" | "workflows" | "logs"
type SidebarAgent = "Web Search" | "Python Executor" | "Email Sender" | "Database" | "History"

const agents: { icon: string; label: SidebarAgent }[] = [
  { icon: "language", label: "Web Search" },
  { icon: "terminal", label: "Python Executor" },
  { icon: "mail", label: "Email Sender" },
  { icon: "database", label: "Database" },
  { icon: "history", label: "History" },
]

export default function DashboardPageConnected() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard")
  const [activeAgent, setActiveAgent] = useState<SidebarAgent | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [workflowInput, setWorkflowInput] = useState("")
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats>({ total: 0, active: 0, running: 0, failed: 0 })
  const [logs, setLogs] = useState<LogItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [settings, setSettings] = useState<DashboardSettings | null>(null)
  const [history, setHistory] = useState<LatestRun[]>([])
  const [latestRun, setLatestRun] = useState<LatestRun | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isBusy, setIsBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState("3 agents active")
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null)
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null)
  const [pollingRunId, setPollingRunId] = useState<string | null>(null)
  const viewer = useMemo(() => getStoredAuthUser(), [])
  const initials = useMemo(() => {
    const source = viewer?.name || viewer?.email || "RK"
    return source
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "RK"
  }, [viewer])

  const isDashboard = activeTab === "dashboard" && activeAgent === null

  const refreshDashboard = async () => {
    const snapshot = await getDashboardSnapshot()
    setWorkflows(snapshot.workflows)
    setWorkflowStats(snapshot.stats)
    setLogs(snapshot.logs)
    setNotifications(snapshot.notifications)
    setSettings(snapshot.settings)
    setHistory(snapshot.history)
    setLatestRun(snapshot.latestRun)
  }

  useEffect(() => {
    refreshDashboard().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to load dashboard."
      setStatusMessage(message)
    })
  }, [])

  useEffect(() => {
    if (latestRun) {
      setRunningWorkflowId(latestRun.workflowId ?? latestRun.id)
      setStatusMessage(`${latestRun.name} ${latestRun.status}`)
    }
  }, [latestRun])

  useEffect(() => {
    if (!pollingRunId) return
    const interval = window.setInterval(async () => {
      try {
        const response = await getRun(pollingRunId)
        setLatestRun(response.run)
        if (response.run.status === "completed" || response.run.status === "failed") {
          setPollingRunId(null)
          setIsBusy(false)
          await refreshDashboard()
        }
      } catch {
        setPollingRunId(null)
        setIsBusy(false)
      }
    }, 2000)
    return () => window.clearInterval(interval)
  }, [pollingRunId])

  const filteredWorkflows = useMemo(() => {
    if (!searchQuery.trim()) return workflows
    const query = searchQuery.toLowerCase()
    return workflows.filter(
      workflow =>
        workflow.name.toLowerCase().includes(query) ||
        workflow.task.toLowerCase().includes(query) ||
        workflow.id.toLowerCase().includes(query)
    )
  }, [searchQuery, workflows])

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs
    const query = searchQuery.toLowerCase()
    return logs.filter(
      log =>
        log.agent.toLowerCase().includes(query) ||
        log.level.toLowerCase().includes(query) ||
        log.message.toLowerCase().includes(query)
    )
  }, [logs, searchQuery])

  const runWorkflow = async (task: string, workflowId?: string) => {
    if (!task.trim()) {
      setStatusMessage("Enter a workflow task to run.")
      return
    }
    setIsBusy(true)
    try {
      const recipient = settings?.notifications.notificationEmail?.trim() || undefined
      const response = await queueAgentWorkflow(task, recipient, workflowId)
      setLatestRun(response.latestRun)
      setStatusMessage(response.message)
      setPollingRunId(response.latestRun.id)
      setActiveTab("dashboard")
      setActiveAgent(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to run workflow."
      setStatusMessage(message)
    } finally {
      setIsBusy(false)
    }
  }

  const createNewWorkflow = async (schedule = "Manual") => {
    const task = workflowInput.trim() || "New automation workflow"
    setIsBusy(true)
    try {
      await createWorkflow(task, schedule)
      setStatusMessage("Workflow created successfully.")
      await refreshDashboard()
      setActiveTab("workflows")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create workflow."
      setStatusMessage(message)
    } finally {
      setIsBusy(false)
    }
  }

  const handleWorkflowToggle = async (workflowId: string) => {
    setIsBusy(true)
    try {
      await toggleWorkflow(workflowId)
      await refreshDashboard()
      setStatusMessage("Workflow status updated.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update workflow."
      setStatusMessage(message)
    } finally {
      setIsBusy(false)
    }
  }

  const handleWorkflowReplay = async (workflowId: string) => {
    setIsBusy(true)
    try {
      const response = await replayWorkflow(workflowId)
      setLatestRun(response.latestRun)
      setStatusMessage(response.message)
      await refreshDashboard()
      setActiveTab("dashboard")
      setActiveAgent(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to replay workflow."
      setStatusMessage(message)
    } finally {
      setIsBusy(false)
    }
  }

  const handleWorkflowDelete = async (workflowId: string) => {
    setIsBusy(true)
    try {
      await deleteWorkflow(workflowId)
      if (latestRun?.workflowId === workflowId) {
        setLatestRun(null)
        setRunningWorkflowId(null)
      }
      await refreshDashboard()
      setStatusMessage("Workflow deleted.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete workflow."
      setStatusMessage(message)
    } finally {
      setIsBusy(false)
    }
  }

  const handleHistoryReplay = async (runId: string) => {
    setIsBusy(true)
    try {
      const response = await replayHistoryRun(runId)
      setLatestRun(response.latestRun)
      setStatusMessage(response.message)
      await refreshDashboard()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to replay history run."
      setStatusMessage(message)
    } finally {
      setIsBusy(false)
    }
  }

  const handleHistoryClone = async (runId: string) => {
    setIsBusy(true)
    try {
      await cloneHistoryRun(runId)
      await refreshDashboard()
      setActiveTab("workflows")
      setStatusMessage("Workflow cloned from history.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to clone history run."
      setStatusMessage(message)
    } finally {
      setIsBusy(false)
    }
  }

  const handleSettingsSave = async (nextSettings: DashboardSettings) => {
    setIsBusy(true)
    try {
      const saved = await saveSettings(nextSettings)
      setSettings(saved)
      await refreshDashboard()
      setStatusMessage("Settings saved.")
      setShowSettings(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save settings."
      setStatusMessage(message)
    } finally {
      setIsBusy(false)
    }
  }

  const handleExportLogs = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "flow-logs.json"
    anchor.click()
    URL.revokeObjectURL(url)
    setStatusMessage("Logs exported.")
  }

  const handleClearLogs = async () => {
    setIsBusy(true)
    try {
      await clearLogs()
      await refreshDashboard()
      setStatusMessage("Logs cleared.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to clear logs."
      setStatusMessage(message)
    } finally {
      setIsBusy(false)
    }
  }

  const handleAttachFile = (file: File | null) => {
    setAttachedFileName(file?.name || null)
    setStatusMessage(file ? `Attached ${file.name}` : "Attachment cleared.")
  }

  const handleDownloadLatestRun = () => {
    if (!latestRun) {
      setStatusMessage("No workflow output is available yet.")
      return
    }
    const blob = new Blob([JSON.stringify(latestRun.output.download, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${latestRun.id.toLowerCase()}-output.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatusMessage("Workflow output downloaded.")
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <>
      <DashboardAmbientBackground />

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: "56px",
        background: "rgba(16,11,28,0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(190,157,255,0.08)",
      }}>
        <Link to="/" style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: "0.9375rem", letterSpacing: "0.08em", color: "#eee4fc", textDecoration: "none" }}>
          FLOW
        </Link>

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
              background: activeTab === tab ? "rgba(190,157,255,0.08)" : "none",
              transition: "all 0.2s",
              textTransform: "capitalize",
            }}>
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ position: "relative" }}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "rgba(238,228,252,0.3)" }}>search</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search workflows..." style={{ background: "rgba(41,34,58,0.5)", border: "1px solid rgba(190,157,255,0.12)", borderRadius: 8, padding: "0.375rem 0.75rem 0.375rem 2rem", fontSize: "0.75rem", color: "#eee4fc", outline: "none", fontFamily: "Inter,sans-serif", width: 180 }} />
          </div>

          <button onClick={() => { setShowNotifications(true); setShowSettings(false) }} style={{ position: "relative", background: "none", border: "none", color: showNotifications ? "#be9dff" : "rgba(238,228,252,0.4)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center", borderRadius: 8, transition: "color 0.2s" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications</span>
            <div style={{ position: "absolute", top: 2, right: 2, width: 7, height: 7, borderRadius: "50%", background: "#ef4444", border: "1.5px solid #100b1c" }} />
          </button>

          <button onClick={() => { setShowSettings(true); setShowNotifications(false) }} style={{ background: "none", border: "none", color: showSettings ? "#be9dff" : "rgba(238,228,252,0.4)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center", borderRadius: 8, transition: "color 0.2s" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>settings</span>
          </button>

          <button onClick={handleLogout} title={viewer ? `Sign out ${viewer.email}` : "Sign out"} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(190,157,255,0.15)", border: "1px solid rgba(190,157,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 700, color: "#be9dff", cursor: "pointer" }}>
            {initials}
          </button>
          <button onClick={handleLogout} style={{ background: "rgba(41,34,58,0.5)", border: "1px solid rgba(190,157,255,0.12)", color: "rgba(238,228,252,0.72)", cursor: "pointer", padding: "0.45rem 0.8rem", borderRadius: 8, fontFamily: "Manrope,sans-serif", fontSize: "0.75rem", fontWeight: 600 }}>
            Logout
          </button>
        </div>
      </nav>

      <aside style={{ position: "fixed", left: 0, top: 56, bottom: 0, width: 220, background: "rgba(16,11,28,0.82)", borderRight: "1px solid rgba(190,157,255,0.08)", display: "flex", flexDirection: "column", zIndex: 50, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid rgba(190,157,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.875rem", background: "rgba(41,34,58,0.5)", borderRadius: 10, border: "1px solid rgba(190,157,255,0.1)" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: isBusy ? "#be9dff" : "#4ade80", animation: "pulse 2s infinite" }} />
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#eee4fc", fontFamily: "Manrope,sans-serif" }}>Automation Hub</div>
              <div style={{ fontSize: "0.625rem", color: "rgba(238,228,252,0.35)" }}>{isBusy ? "Workflow Running" : "System Active"}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "1rem 1.25rem 0.375rem", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(238,228,252,0.25)", fontFamily: "Manrope,sans-serif" }}>
          Agents
        </div>

        <nav style={{ flex: 1 }}>
          <a href="#" onClick={e => { e.preventDefault(); setActiveAgent(null); setActiveTab("dashboard") }} className={`sidebar-item${isDashboard ? " active" : ""}`}>
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </a>

          {agents.map(a => (
            <a key={a.label} href="#" onClick={e => { e.preventDefault(); setActiveAgent(a.label); setActiveTab("dashboard") }} className={`sidebar-item${activeAgent === a.label ? " active" : ""}`}>
              <span className="material-symbols-outlined">{a.icon}</span>
              {a.label}
              {a.label === "Web Search" && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite" }} />}
            </a>
          ))}
        </nav>

        <div style={{ padding: "1.25rem", borderTop: "1px solid rgba(190,157,255,0.08)" }}>
          <button className="btn-primary" style={{ width: "100%", justifyContent: "center", borderRadius: 10, padding: "0.625rem 1rem" }} onClick={() => createNewWorkflow()}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> New Workflow
          </button>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            {[["help", "Docs", "/"], ["contact_support", "Support", "mailto:support@flow.local"]].map(([icon, label, href]) => (
              <a key={label} href={href} style={{ color: "rgba(238,228,252,0.3)", fontSize: "0.75rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontFamily: "Manrope,sans-serif" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>{label}
              </a>
            ))}
          </div>
        </div>
      </aside>

      <div style={{ marginLeft: 220, paddingTop: 56, position: "relative", zIndex: 1 }}>
        {activeTab === "workflows" && <WorkflowsPageConnected workflows={filteredWorkflows} stats={workflowStats} onCreateWorkflow={() => createNewWorkflow()} onToggleWorkflow={handleWorkflowToggle} onReplayWorkflow={handleWorkflowReplay} onDeleteWorkflow={handleWorkflowDelete} />}
        {activeTab === "logs" && <LogsPageConnected logs={filteredLogs} onExport={handleExportLogs} onClear={handleClearLogs} />}
        {activeTab === "dashboard" && activeAgent && <AgentPageConnected agent={activeAgent} history={history} onReplayHistory={handleHistoryReplay} onCloneHistory={handleHistoryClone} onStatusMessage={setStatusMessage} onRefresh={refreshDashboard} />}

        {isDashboard && (
          <>
            <HeroInputSectionConnected
              inputValue={workflowInput}
              onInputChange={setWorkflowInput}
              onRunWorkflow={() => runWorkflow(workflowInput)}
              onScheduleWorkflow={() => createNewWorkflow("Daily 8am")}
              onAttachFile={handleAttachFile}
              statusChips={[
                { label: statusMessage, dot: isBusy ? "#be9dff" : "#4ade80" },
                { label: runningWorkflowId ? `${runningWorkflowId} ${latestRun ? latestRun.status : "active"}` : "No workflow run yet", dot: latestRun ? "#4ade80" : null },
                { label: attachedFileName || `${workflowStats.total} workflows available`, dot: null },
              ]}
              isBusy={isBusy}
            />
            <ExecutionSectionConnected latestRun={latestRun} />
            <ReasoningSectionConnected latestRun={latestRun} onDownloadJson={handleDownloadLatestRun} />
            <TemplatesSection onUseTemplate={(prompt) => { setWorkflowInput(prompt); setActiveTab("dashboard"); setActiveAgent(null) }} />
          </>
        )}
      </div>

      {showSettings && settings && <SettingsPanelConnected onClose={() => setShowSettings(false)} settings={settings} onSave={handleSettingsSave} />}
      {showNotifications && <NotificationsPanelConnected onClose={() => setShowNotifications(false)} notifications={notifications} />}
    </>
  )
}
