/**
 * GradeBadge — the site's signature recurring element: a climbing
 * grade tag (e.g. 5a, 6c+) paired with a plain-language label.
 * Encodes real route difficulty rather than decorating for its own sake.
 */
export default function GradeBadge({ grade, label }) {
  return (
    <span className="grade-badge">
      <span className="grade">{grade}</span>
      <span className="label">{label}</span>
    </span>
  )
}
