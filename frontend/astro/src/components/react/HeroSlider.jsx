import { useState } from 'react';

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
  const [x0, setX0] = useState(null);
  const n = slides.length;
  const go = (d) => setI((i + d + n) % n);
  const s = slides[i];

  return (
    <div className="hs">
      <div className="hs-frame" />
      {s.badge && (
        <div className="hs-badge"><big>★</big>Beginners<br />welcome</div>
      )}

      <div
        className="hs-slide"
        onTouchStart={(e) => setX0(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (x0 === null) return;
          const dx = e.changedTouches[0].clientX - x0;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          setX0(null);
        }}
      >
        <img key={s.src} src={s.src} alt={s.alt} />
        <div className="hs-shade" />
        {s.caption && (
          <p className="hs-cap"><Pin />{s.caption}</p>
        )}
        {n > 1 && <span className="hs-count">{i + 1} / {n}</span>}
      </div>

      {n > 1 && (
        <>
          <button className="hs-arrow l" aria-label="Previous photo" onClick={() => go(-1)}><Arrow dir="l" /></button>
          <button className="hs-arrow r" aria-label="Next photo" onClick={() => go(1)}><Arrow dir="r" /></button>
          <div className="hs-dots">
            {slides.map((_, k) => (
              <button key={k} aria-label={`Go to photo ${k + 1}`}
                      className={k === i ? 'on' : ''} onClick={() => setI(k)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
