/**
 * CliffEdge — a clean, minimal section divider bar.
 * Simple and understated, just a thin horizontal rule.
 */
export default function CliffEdge({ fill = 'var(--charcoal)', height = 24 }) {
  return (
    <div
      className="cliff-edge"
      style={{ height, background: fill }}
      aria-hidden="true"
    />
  )
}
