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

export default function HeroSlider({ slides }) {
  const [i, setI] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [animDir, setAnimDir] = useState(0);
  const [nextIndex, setNextIndex] = useState(null);
  const [x0, setX0] = useState(null);
  const n = slides.length;
  const s = slides[i];
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const go = (d) => {
    if (d === 0 || n <= 1 || animating) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ni = (i + d + n) % n;
    if (reduce) {
      setI(ni);
      return;
    }
    setAnimDir(d);
    setNextIndex(ni);
    setAnimating(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setI((cur) => {
        if (nextIndex !== null) return nextIndex;
        return (cur + d + n) % n;
      });
      setNextIndex(null);
      setAnimating(false);
      setAnimDir(0);
      timeoutRef.current = null;
    }, 520);
  };

  const onAnimEnd = (e) => {
    if (e.propertyName && e.propertyName !== 'transform') return;
    if (!animating || nextIndex === null) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setI(nextIndex);
    setNextIndex(null);
    setAnimating(false);
    setAnimDir(0);
  };

  // the next photos, shown stacked behind the current one (visual stack)
  const behind = [1, 2, 3].filter((k) => k < n).map((k) => slides[(i + k) % n]);
  const frontNext = nextIndex !== null ? slides[nextIndex] : null;

  return (
    <div className={`hs ${animating ? (animDir > 0 ? 'is-anim is-next' : 'is-anim is-prev') : ''}`} aria-busy={animating}>
      <div className="hs-stack">
        {behind.map((b, k) => (
          <div key={`bk-${b.src}-${i}-${k}`} className={`hs-bk hs-bk${k + 1}`}>
            <img src={b.src} alt="" aria-hidden="true" loading="lazy" decoding="async" />
          </div>
        ))}

        <div
          className="hs-card"
          onTouchStart={(e) => setX0(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (x0 === null) return;
            const dx = e.changedTouches[0].clientX - x0;
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            setX0(null);
          }}
          onTransitionEnd={onAnimEnd}
        >
          <div className="hs-img">
            <img
              src={s.src}
              alt={s.alt}
              loading="eager"
              decoding="async"
              style={{ objectFit: s.fit || 'cover', objectPosition: s.pos || 'center' }}
            />
          </div>

          {animating && frontNext && (
            <div className="hs-card hs-card-next" aria-hidden="true">
              <div className="hs-img">
                <img
                  src={frontNext.src}
                  alt=""
                  loading="eager"
                  decoding="async"
                  style={{ objectFit: frontNext.fit || 'cover', objectPosition: frontNext.pos || 'center' }}
                />
              </div>
            </div>
          )}

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
                      className={k === i ? 'on' : ''} onClick={() => setI(k)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
