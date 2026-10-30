import CliffEdge from './CliffEdge.jsx'

export default function PageHeader({ eyebrow, title, children, compact = false }) {
  return (
    <div className={`page-header${compact ? ' compact' : ''}`}>
      <div className="page-header-pattern" aria-hidden="true" />
      <div className="page-header-accent" aria-hidden="true" />
      <div className="wrap page-header-inner">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {children && <div className="page-header-desc">{children}</div>}
      </div>
      <CliffEdge fill="var(--chalk)" height={40} />
    </div>
  )
}
