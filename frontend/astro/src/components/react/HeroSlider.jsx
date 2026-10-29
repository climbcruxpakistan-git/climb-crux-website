import { useEffect, useRef, useState } from 'react';

const Pin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F47321" aria-hidden="true">
    <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
  </svg>
);

const Arrow = ({ dir }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F47321"
       strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 'l' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
  </svg>
);

const SWIPE_THRESHOLD = 40;
const ANIM_MS = 650;

export default function HeroSlider({ slides }) {
  const [i, setI] = useState(0);
  // { to, dir } while a slide transition is running, null otherwise
  const [pending, setPending] = useState(null);
  const [x0, setX0] = useState(null);
  const pendingRef = useRef(null);
  const timerRef = useRef(null);
  const n = slides.length;
  const s = slides[i];
  const animating = pending !== null;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const clearTransition = () => {
    pendingRef.current = null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPending(null);
  };

  // Commit the slide once the incoming card has finished coming to the front.
  const finish = () => {
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPending(null);
    setI(p.to);
  };

  const go = (d) => {
    if (!d || n <= 1 || pendingRef.current) return;
    const to = (i + d + n) % n;
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setI(to);
      return;
    }
    pendingRef.current = { to, dir: d };
    setPending({ to, dir: d });
    // Safety net: if animationend never fires (background tab, etc.)
    timerRef.current = setTimeout(finish, ANIM_MS + 250);
  };

  const jump = (k) => {
    if (k === i) return;
    clearTransition();
    setI(k);
  };

  // the next photos, shown stacked behind the current one (visual stack)
  const behind = [1, 2, 3].filter((k) => k < n).map((k) => slides[(i + k) % n]);
  const incoming = pending ? slides[pending.to] : null;
  const dir = pending ? (pending.dir > 0 ? 'next' : 'prev') : null;

  return (
    <div className={`hs${animating ? ' is-anim' : ''}`} aria-busy={animating}>
      <div
        className="hs-stack"
        onTouchStart={(e) => setX0(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (x0 === null) return;
          const dx = e.changedTouches[0].clientX - x0;
          if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
          setX0(null);
        }}
      >
        {behind.map((b, k) => (
          <div key={`bk-${b.src}-${i}-${k}`} className={`hs-bk hs-bk${k + 1}`}>
            <img src={b.src} alt="" aria-hidden="true" loading="lazy" decoding="async" />
          </div>
        ))}

        {incoming && (
          <div
            className={`hs-card hs-in from-${dir}`}
            aria-hidden="true"
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget && e.animationName.startsWith('hs-in')) finish();
            }}
          >
            <div className="hs-img">
              <img
                src={incoming.src}
                alt=""
                loading="eager"
                decoding="async"
                style={{ objectFit: incoming.fit || 'cover', objectPosition: incoming.pos || 'center' }}
              />
            </div>
          </div>
        )}

        <div className={`hs-card hs-front${dir ? ` is-${dir}` : ''}`}>
          <div className="hs-img">
            <img
              src={s.src}
              alt={s.alt}
              loading="eager"
              decoding="async"
              style={{ objectFit: s.fit || 'cover', objectPosition: s.pos || 'center' }}
            />
          </div>
        </div>

        {s.badge && (
          <div
            className="hs-badge"
            style={{
              background: s.badge.color,
              color: s.badge.textColor || '#fff',
              boxShadow: `0 14px 30px ${s.badge.color}80`,
            }}
          >
            <big>★</big>
            {s.badge.text.split(' ')[0]}
            <br />
            {s.badge.text.split(' ').slice(1).join(' ')}
          </div>
        )}

        {n > 1 && (
          <>
            <button className="hs-arrow l" aria-label="Previous photo" onClick={() => go(-1)}><Arrow dir="l" /></button>
            <button className="hs-arrow r" aria-label="Next photo" onClick={() => go(1)}><Arrow dir="r" /></button>
          </>
        )}
      </div>

      <div className="hs-cap2">
        <div>
          <h3>{s.title}</h3>
          {s.location && <p><Pin />{s.location}</p>}
        </div>
        {n > 1 && (
          <div className="hs-dots">
            {slides.map((_, k) => (
              <button key={k} aria-label={`Go to photo ${k + 1}`}
                      className={k === i ? 'on' : ''} onClick={() => jump(k)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
