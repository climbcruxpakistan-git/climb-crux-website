/**
 * PlaceholderPhoto — stand-in visual until real session photography
 * is dropped in. Styled as a topo-line rock panel (not a gray box)
 * so it still feels on-brand while empty.
 * Swap by replacing this component's usage with a plain <img src="..." />.
 */
export default function PlaceholderPhoto({ tag, ratio = '4 / 3', className = '' }) {
  return (
    <div className={`placeholder-photo ${className}`} style={{ '--ar': ratio }}>
      {tag && <span className="tag">{tag}</span>}
    </div>
  )
}
