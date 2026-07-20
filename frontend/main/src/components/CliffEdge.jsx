/**
 * CliffEdge — a jagged rock-silhouette divider, echoing the cliff
 * profile in the Climb Crux mark. Used between sections instead of a
 * generic straight rule, so the page itself reads like a route line
 * climbing from section to section.
 */
export default function CliffEdge({ fill = 'var(--charcoal)', flip = false, height = 64 }) {
  return (
    <svg
      className="cliff-edge"
      style={{ transform: flip ? 'scaleY(-1)' : 'none', height }}
      viewBox="0 0 1200 90"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        fill={fill}
        d="M0,90 L0,38 L40,44 L78,18 L110,30 L150,10 L195,26 L230,6 L268,22 L300,0 L340,20 L380,8 L420,32 L470,16 L512,36 L560,14 L610,30 L655,4 L700,24 L745,10 L790,34 L835,18 L880,38 L930,12 L975,28 L1020,6 L1065,26 L1110,10 L1160,30 L1200,20 L1200,90 Z"
      />
    </svg>
  )
}
