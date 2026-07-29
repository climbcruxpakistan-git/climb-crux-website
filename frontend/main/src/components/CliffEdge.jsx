/**
 * CliffEdge — a premium layered mountain silhouette divider, echoing
 * the Margalla Hills skyline and the cliff profile in the Climb Crux mark.
 *
 * Three overlapping layers create depth:
 *   1. Back layer — soft, receding foothills (low opacity)
 *   2. Mid layer — medium ridge with more drama
 *   3. Front layer — the sharp main cliff silhouette
 *
 * A thin orange crest line traces the peak tops like a climbing route.
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
      {/* Back foothills — soft, receding layer */}
      <path
        fill={fill}
        opacity="0.12"
        d="M0,90 L0,62 L80,56 L180,40 L280,52 L380,32 L480,46 L580,28 L680,42 L780,24 L880,38 L980,20 L1080,34 L1180,26 L1200,30 L1200,90 Z"
      />

      {/* Mid ridge — medium drama */}
      <path
        fill={fill}
        opacity="0.30"
        d="M0,90 L0,55 L70,50 L150,35 L240,48 L330,28 L420,42 L510,24 L600,38 L690,20 L780,34 L870,16 L960,28 L1050,15 L1140,26 L1200,36 L1200,90 Z"
      />

      {/* Front cliff — the main dramatic silhouette */}
      <path
        fill={fill}
        d="M0,90 L0,45 L55,50 L95,15 L140,32 L185,5 L230,24 L275,3 L320,18 L365,38 L415,8 L460,28 L510,6 L555,22 L600,44 L650,12 L700,28 L750,38 L800,4 L850,20 L900,3 L945,16 L990,40 L1040,8 L1085,26 L1130,12 L1175,34 L1200,40 L1200,90 Z"
      />

      {/* Orange crest line — traces the route along the very peaks */}
      <path
        className="cliff-edge-crest"
        fill="none"
        stroke="var(--orange)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M0,45 L55,50 L95,15 L140,32 L185,5 L230,24 L275,3 L320,18 L365,38 L415,8 L460,28 L510,6 L555,22 L600,44 L650,12 L700,28 L750,38 L800,4 L850,20 L900,3 L945,16 L990,40 L1040,8 L1085,26 L1130,12 L1175,34 L1200,40"
      />
    </svg>
  )
}
