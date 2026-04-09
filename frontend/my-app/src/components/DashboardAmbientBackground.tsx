export default function DashboardAmbientBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 22%, rgba(86, 124, 255, 0.22) 0%, rgba(86, 124, 255, 0) 38%), radial-gradient(circle at 78% 18%, rgba(190, 157, 255, 0.2) 0%, rgba(190, 157, 255, 0) 32%), radial-gradient(circle at 58% 74%, rgba(74, 222, 128, 0.12) 0%, rgba(74, 222, 128, 0) 28%), linear-gradient(180deg, rgba(12, 9, 24, 0.14) 0%, rgba(16, 11, 28, 0.34) 100%)",
        }}
      />

      <div className="dashboard-ambient-grid" />

      <div
        className="dashboard-ambient-orb dashboard-ambient-orb-primary"
        style={{
          width: 620,
          height: 620,
          top: "10%",
          left: "14%",
        }}
      />
      <div
        className="dashboard-ambient-orb dashboard-ambient-orb-secondary"
        style={{
          width: 520,
          height: 520,
          top: "48%",
          left: "60%",
        }}
      />
      <div
        className="dashboard-ambient-orb dashboard-ambient-orb-tertiary"
        style={{
          width: 400,
          height: 400,
          top: "68%",
          left: "8%",
        }}
      />
    </div>
  )
}
