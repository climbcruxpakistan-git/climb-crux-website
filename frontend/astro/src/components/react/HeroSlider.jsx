import { useRef, useState } from 'react';

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

// Resize Cloudinary originals (skip if a transformation is already present)
const opt = (url) =>
  url && url.includes('res.cloudinary.com') && /\/upload\/v\d/.test(url)
    ? url.replace('/upload/', '/upload/w_1100,q_auto,f_auto/')
    : url;

export default function HeroSlider({ slides }) {
  const [i, setI] = useState(0);
  const x0 = useRef(null);
  const n = slides.length;
  const s = slides[i];

  const go = (d) => setI((p) => (p + d + n) % n);

  // Which "slot" a card occupies relative to the current slide
  const slotOf = (idx) => {
    const pos = (idx - i + n) % n;
    if (pos === 0) return '0';
    if (pos >= 1 && pos <= 3 && pos < n - 1) return String(pos);
    if (pos === n - 1) return 'out';
    return 'hidden';
  };

  return (
    <div className="hs">
      <div
        className="hs-stack"
        onTouchStart={(e) => { x0.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (x0.current === null) return;
          const dx = e.changedTouches[0].clientX - x0.current;
          if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
          x0.current = null;
        }}
      >
        {/* invisible in-flow twin: gives the stack its height */}
        <div className="hs-card hs-spacer" aria-hidden="true">
          <div className="hs-img" />
        </div>

        {slides.map((sl, idx) => {
          const slot = slotOf(idx);
          return (
            <div key={idx} className="hs-card hs-slide" data-pos={slot} aria-hidden={slot !== '0'}>
              <div className="hs-img">
                <img
                  src={opt(sl.src)}
                  alt={slot === '0' ? sl.alt : ''}
                  loading="eager"
                  decoding="async"
                  draggable="false"
                  style={{ objectFit: sl.fit || 'cover', objectPosition: sl.pos || 'center' }}
                />
              </div>
              <span className="hs-shade" />
            </div>
          );
        })}

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
        <div key={i} className="hs-cap-text">
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
