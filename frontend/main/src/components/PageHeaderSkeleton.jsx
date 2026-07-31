import CliffEdge from './CliffEdge.jsx'

/**
 * PageHeaderSkeleton — shimmer placeholder shown while API-driven header
 * content (title + description) is still loading. Prevents the flash of
 * hardcoded fallback text before the real content arrives.
 */
export default function PageHeaderSkeleton() {
  return (
    <div className="page-header" aria-hidden="true">
      <div className="page-header-pattern" aria-hidden="true" />
      <div className="page-header-accent" aria-hidden="true" />
      <div className="wrap page-header-inner">
        <span className="skeleton skeleton-eyebrow" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </div>
      <CliffEdge fill="var(--chalk)" height={40} />
    </div>
  )
}
