import { Link } from "react-router-dom"

type AuthFormFooterProps = {
  prompt: string
  actionLabel: string
  actionTo: string
}

export default function AuthFormFooter({ prompt, actionLabel, actionTo }: AuthFormFooterProps) {
  return (
    <div style={{ textAlign: "center", color: "rgba(238,228,252,0.52)", fontSize: "0.88rem" }}>
      {prompt}{" "}
      <Link to={actionTo} style={{ color: "#be9dff", textDecoration: "none", fontWeight: 700 }}>
        {actionLabel}
      </Link>
    </div>
  )
}
