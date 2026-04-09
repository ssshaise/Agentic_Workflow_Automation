type AuthFieldProps = {
  label: string
  type?: string
  value: string
  placeholder?: string
  autoComplete?: string
  onChange: (value: string) => void
}

export default function AuthField({
  label,
  type = "text",
  value,
  placeholder,
  autoComplete,
  onChange,
}: AuthFieldProps) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          marginBottom: "0.45rem",
          color: "#eee4fc",
          fontSize: "0.83rem",
          fontWeight: 600,
          fontFamily: "Manrope, sans-serif",
        }}
      >
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
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      />
    </label>
  )
}
