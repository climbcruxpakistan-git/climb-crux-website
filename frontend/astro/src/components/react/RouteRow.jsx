import { bandOf } from '../../lib/gradeBand.js';

export default function RouteRow({ route, selected, onSelect, href }) {
  const pitches = route.type === 'multi-pitch' && route.pitches?.length;
  return (
    <li className={`rx-row${selected ? ' is-sel' : ''}`}>
      <button type="button" className="rx-row-main" aria-pressed={selected} onClick={() => onSelect(route)}>
        <span className="rx-grade" data-band={bandOf(route.grade)}>{route.grade}</span>
        <span className="rx-row-body">
          <strong>{route.name}</strong>
          <span className="rx-row-venue">{route.venue}</span>
          <span className="rx-chips">
            <em>{route.area}</em>
            {pitches ? <em>{route.pitches.length} pitches</em> : route.length ? <em>{route.length} m</em> : null}
          </span>
        </span>
      </button>
      <a className="rx-row-link" href={href} aria-label={`Open the ${route.name} route page`}>↗</a>
    </li>
  );
}
