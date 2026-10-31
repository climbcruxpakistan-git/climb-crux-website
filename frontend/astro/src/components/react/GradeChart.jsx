import { useEffect, useMemo, useState } from 'react';
import { bandOf } from '../../lib/gradeBand.js';
import './GradeChart.css';

/**
 * Hero chart: number of routes per French grade.
 * Props (all serialisable, computed in the .astro page):
 *   data         [{ grade: '4b', count: 2 }, ...]  in grade order
 *   libraryBase  ROUTE_LIBRARY_BASE ('/rock-climbing-guide-islamabad/routes/')
 *   minParam / maxParam   must match ROUTE_PARAMS.minGrade / maxGrade
 *   mode         'filter'   -> writes ?minGrade=X&maxGrade=X into the URL and tells RouteExplorer (same page)
 *                'navigate' -> goes to the library page with that grade pre-selected
 *   resultsId    id of the results heading to scroll to
 */
export default function GradeChart({
  data,
  libraryBase,
  minParam = 'minGrade',
  maxParam = 'maxGrade',
  mode = 'filter',
  resultsId = 'route-results',
}) {
  const [active, setActive] = useState(null);
  const [selected, setSelected] = useState(null);

  const max = useMemo(() => Math.ceil(Math.max(...data.map((d) => d.count), 1) / 2) * 2, [data]);
  const ticks = useMemo(() => Array.from({ length: max / 2 + 1 }, (_, i) => i * 2), [max]);

  // Keep the highlighted bar in sync with the URL (back/forward, slider, reset)
  useEffect(() => {
    if (mode !== 'filter') return undefined;
    const read = () => {
      const p = new URLSearchParams(window.location.search);
      const a = p.get(minParam);
      setSelected(a && a === p.get(maxParam) ? a : null);
    };
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [mode, minParam, maxParam]);

  const choose = (grade) => {
    const g = encodeURIComponent(grade);
    if (mode === 'navigate') {
      window.location.assign(`${libraryBase}?${minParam}=${g}&${maxParam}=${g}`);
      return;
    }
    const p = new URLSearchParams(window.location.search);
    const clear = selected === grade;
    if (clear) {
      p.delete(minParam);
      p.delete(maxParam);
    } else {
      p.set(minParam, grade);
      p.set(maxParam, grade);
    }
    const q = p.toString();
    window.history.replaceState({}, '', window.location.pathname + (q ? `?${q}` : ''));
    // RouteExplorer already re-reads the URL on 'popstate', so no change is needed there
    window.dispatchEvent(new PopStateEvent('popstate'));
    if (!clear) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById(resultsId)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  };

  return (
    <figure className="gc" aria-label="Number of routes by French grade">
      <div className="gc-plot">
        <span className="gc-y">Routes</span>
        {ticks.map((t) => (
          <div key={t} className="gc-grid" style={{ bottom: `${(t / max) * 100}%` }}>
            <span>{t}</span>
          </div>
        ))}
        <div className="gc-cols">
          {data.map((d) => {
            const h = `${(d.count / max) * 100}%`;
            return (
              <button
                type="button"
                key={d.grade}
                className={`gc-col${selected === d.grade ? ' is-on' : ''}`}
                data-band={bandOf(d.grade)}
                aria-pressed={selected === d.grade}
                aria-label={`${d.grade}: ${d.count} ${d.count === 1 ? 'route' : 'routes'}. Show these routes`}
                onClick={() => choose(d.grade)}
                onMouseEnter={() => setActive(d.grade)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(d.grade)}
                onBlur={() => setActive(null)}
              >
                <span className="gc-bar" style={{ height: h }} />
                {active === d.grade && (
                  <span className="gc-tip" style={{ bottom: `calc(${h} + 8px)` }}>
                    <b>{d.count}</b> {d.count === 1 ? 'route' : 'routes'} at {d.grade}
                  </span>
                )}
                <span className="gc-x">{d.grade}</span>
              </button>
            );
          })}
        </div>
      </div>
    </figure>
  );
}
