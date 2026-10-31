import { bandOf, BAND_LABEL } from '../../lib/gradeBand.js';

/**
 * Props: route (flattened route) | null, allRoutes (flattened), grades (AVAILABLE_GRADES in order),
 *        href (route page URL), onClose (mobile sheet),
 *        onSelect(name) — makes the related-route names clickable: clicking swaps the preview.
 */
export default function RoutePreview({ route, allRoutes, grades, href, onClose, onSelect }) {
  if (!route) {
    return <div className="rx-pv-empty">Select a route to preview its grade, venue and details.</div>;
  }
  const band = bandOf(route.grade);
  const photo = route.images?.[0];
  const multi = route.type === 'multi-pitch' && route.pitches?.length;
  const atVenue = allRoutes.filter((r) => r.venue === route.venue && r.name !== route.name).slice(0, 5);
  const sameGrade = allRoutes.filter((r) => r.grade === route.grade && r.name !== route.name).slice(0, 5);
  const gradeLabel = route.tradGrade ? `${route.tradGrade} (${route.grade})` : route.grade;
  const idx = (g) => Math.max(0, grades.indexOf(g));

  return (
    <article className="rx-pv" data-band={band}>
      <button type="button" className="rx-pv-close" onClick={onClose} aria-label="Close preview">×</button>

      {photo?.url && (
        <figure className="rx-pv-photo">
          <img src={photo.url} alt={photo.caption || `${route.venue}, ${route.area}`} loading="lazy" />
          {photo.caption && <figcaption>{photo.caption}</figcaption>}
        </figure>
      )}

      <header className="rx-pv-head">
        <span className="rx-grade rx-grade--xl" data-band={band}>{route.grade}</span>
        <div>
          <h3>{route.name}</h3>
          <p>{BAND_LABEL[band]} · French grade {gradeLabel}</p>
        </div>
      </header>

      <dl className="rx-facts">
        <div><dt>Venue</dt><dd>{route.venue}</dd></div>
        <div><dt>Area</dt><dd>{route.area}</dd></div>
        <div><dt>Length</dt><dd>{multi ? `${route.pitches.length} pitches` : route.length ? `${route.length} m` : 'Not listed'}</dd></div>
        <div><dt>Grade</dt><dd>{route.grade}</dd></div>
      </dl>

      {!multi && route.description && <p className="rx-desc">{route.description}</p>}

      <h4 className="rx-sh">Where it sits on the Margalla grade scale</h4>
      <div className="rx-ladder" role="img" aria-label={`${route.grade} on a scale from ${grades[0]} to ${grades[grades.length - 1]}`}>
        {grades.map((g) => <i key={g} data-band={bandOf(g)} className={g === route.grade ? 'me' : ''} />)}
      </div>
      <div className="rx-ladder-l"><span>{grades[0]} easiest</span><span>{grades[grades.length - 1]} hardest</span></div>

      {multi && (
        <>
          <h4 className="rx-sh">Pitch by pitch</h4>
          <ol className="rx-pitches">
            {route.pitches.map((p, i) => (
              <li key={p.label || i}>
                <b>P{i + 1}</b>
                <span className="rx-grade rx-grade--sm" data-band={bandOf(p.grade)}>{p.grade}</span>
                <div>
                  <div className="rx-pbar" data-band={bandOf(p.grade)} style={{ width: `${((idx(p.grade) + 1) / grades.length) * 100}%` }} />
                  <p>{p.description}</p>
                  {p.length ? <small>{p.length} m</small> : null}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}

      <div className="rx-two">
        <section>
          <h4 className="rx-sh">Also at {route.venue}</h4>
          {atVenue.length ? atVenue.map((r) => (
            <button
              type="button"
              className="rx-rel rx-rel-btn"
              key={r.name}
              onClick={() => onSelect?.(r.name)}
              aria-label={`Preview ${r.name}`}
            >
              <span>{r.name}</span><span className="rx-grade rx-grade--sm" data-band={bandOf(r.grade)}>{r.grade}</span>
            </button>
          )) : <div className="rx-rel">No other routes listed</div>}
        </section>
        <section>
          <h4 className="rx-sh">Other {route.grade} routes</h4>
          {sameGrade.length ? sameGrade.map((r) => (
            <button
              type="button"
              className="rx-rel rx-rel-btn"
              key={r.name}
              onClick={() => onSelect?.(r.name)}
              aria-label={`Preview ${r.name}`}
            >
              <span>{r.name}</span><span className="rx-grade rx-grade--sm" data-band={bandOf(r.grade)}>{r.grade}</span>
            </button>
          )) : <div className="rx-rel">No other routes at this grade</div>}
        </section>
      </div>

      <a className="btn btn-primary rx-cta" href={href}>Open full route page</a>
      <p className="rx-note">Source: Monkey Business – Margalla Climbing, John Arran (2011). Confirm current conditions before climbing.</p>
    </article>
  );
}
