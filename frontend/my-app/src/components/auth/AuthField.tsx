export default function AuthField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", marginBottom: "0.45rem", color: "#eee4fc", fontSize: "0.83rem", fontWeight: 600, fontFamily: "Manrope,sans-serif" }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          borderRadius: 14,
          border: "1px solid rgba(190,157,255,0.16)",
          background: "rgba(14,10,24,0.92)",
          color: "#eee4fc",
          padding: "0.9rem 1rem",
          outline: "none",
          fontSize: "0.95rem",
        }}
      />
    </label>
  )
}
