import { useEffect, useRef, useState } from 'react';
import { plural } from './data';

const collectionHref = (slug) => `/gallery/${slug}/`;
const albumHref = (collection, album) => `/gallery/${collection}/${album}/`;

function Card({ href, img, title, meta, className = '' }) {
  return (
    <a href={href} className={`gx-card ${className}`}>
      {img ? <img src={img} alt="" loading="lazy" /> : <div className="gx-empty" />}
      <div className="gx-cap">
        <h3>{title}</h3>
        <p>{meta}</p>
      </div>
    </a>
  );
}

/* ---------- /gallery ---------- */
export function GalleryHome({ collections }) {
  const [filter, setFilter] = useState('all');
  const list = filter === 'all' ? collections : collections.filter((c) => c.slug === filter);

  return (
    <div className="gx">
      <header className="gx-hero">
        <div className="gx-inner">
          <span className="gx-eyebrow">Gallery · Margalla Hills</span>
          <h1>From the wall.</h1>
          <p>A running record of sessions on Margalla Hills. Public climbs, Private coaching and Group Training.</p>
          <div className="gx-chips" role="group" aria-label="Filter collections">
            <button type="button" className={`gx-chip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>All</button>
            {collections.map((c) => (
              <button type="button" key={c.slug} className={`gx-chip ${filter === c.slug ? 'on' : ''}`} onClick={() => setFilter(c.slug)}>
                {c.title}
              </button>
            ))}
          </div>
        </div>
      </header>
      <section className={`gx-wrap gx-grid ${filter === 'all' ? 'gx-feature' : ''}`}>
        {list.length === 0 && <p className="gx-sub">No photos yet. Check back soon!</p>}
        {list.map((c) => (
          <Card key={c.slug} href={collectionHref(c.slug)} img={c.cover} title={c.title}
            meta={`${plural(c.albumCount, 'album')} · ${plural(c.photoCount, 'photo')}`} />
        ))}
      </section>
    </div>
  );
}

/* ---------- /gallery/:collection ---------- */
export function CollectionView({ collection, nav }) {
  return (
    <div className="gx">
      <div className="gx-wrap">
        <nav className="gx-crumb"><a href="/gallery/">Gallery</a> / <b>{collection.title}</b></nav>
        <h1 className="gx-title">{collection.title}</h1>
        <p className="gx-sub">{plural(collection.albumCount, 'album')} · {plural(collection.photoCount, 'photo')}</p>
      </div>
      <div className="gx-wrap gx-split">
        <aside aria-label="Collections">
          <div className="gx-eyebrow dark">Collections</div>
          {nav.map((x) => (
            <a key={x.slug} href={collectionHref(x.slug)} className={x.slug === collection.slug ? 'on' : ''}>{x.title}</a>
          ))}
        </aside>
        <div className="gx-grid gx-feature-2">
          {collection.albums.map((a) => (
            <Card key={a.slug} href={albumHref(collection.slug, a.slug)} img={a.cover}
              title={a.title} meta={plural(a.photoCount, 'photo')} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- /gallery/:collection/:album ---------- */
export function AlbumView({ collection, album, prev, next }) {
  const [open, setOpenState] = useState(null);

  // The viewer is shareable: /gallery/<collection>/<album>/?photo=3
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('photo');
    if (param === null || param === '') return;
    const n = Number(param);
    if (Number.isInteger(n) && n >= 0 && n < album.photos.length) setOpenState(n);
  }, [album.photos.length]);

  const setOpen = (n) => {
    setOpenState(n);
    const url = new URL(window.location.href);
    if (n == null) url.searchParams.delete('photo');
    else url.searchParams.set('photo', String(n));
    window.history.replaceState({}, '', url);
  };

  const share = () => {
    if (navigator.share) navigator.share({ title: album.title, url: location.href });
    else navigator.clipboard.writeText(location.href);
  };

  return (
    <div className="gx">
      <div className="gx-wrap">
        <nav className="gx-crumb">
          <a href="/gallery/">Gallery</a> / <a href={collectionHref(collection.slug)}>{collection.title}</a> / <b>{album.title}</b>
        </nav>
        <div className="gx-row">
          <div>
            <h1 className="gx-title">{album.title}</h1>
            <p className="gx-sub">{plural(album.photos.length, 'photo')}</p>
          </div>
          <button type="button" className="gx-ghost" onClick={share}>Share</button>
        </div>
        <div className="gx-photos">
          {album.photos.map((p, n) => (
            <button type="button" key={n} className="gx-tile" onClick={() => setOpen(n)}
              aria-label={`Open photo ${n + 1}: ${p.caption || album.title}`}>
              <img src={p.src} alt={p.caption || album.title} loading="lazy" />
              <span className="gx-num">{n + 1} / {album.photos.length}</span>
              {p.caption && <span className="gx-tcap">{p.caption}</span>}
            </button>
          ))}
        </div>
        <div className="gx-pn">
          {prev
            ? <a href={albumHref(collection.slug, prev.slug)}><small>← Previous album</small><b>{prev.title}</b></a>
            : <span />}
          {next
            ? <a href={albumHref(collection.slug, next.slug)} style={{ textAlign: 'right' }}><small>Next album →</small><b>{next.title}</b></a>
            : <span />}
        </div>
      </div>
      {open != null && album.photos[open] && (
        <Lightbox title={album.title} photos={album.photos} index={open}
          onChange={setOpen} onClose={() => setOpen(null)} onShare={share} />
      )}
    </div>
  );
}

/* ---------- viewer ---------- */
function Lightbox({ title, photos, index, onChange, onClose, onShare }) {
  const touchX = useRef(null);
  const go = (n) => onChange(Math.max(0, Math.min(photos.length - 1, n)));

  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', key);
      document.body.style.overflow = '';
    };
  });

  const p = photos[index];

  return (
    <div className="gx-lb" role="dialog" aria-modal="true" aria-label={title}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const d = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(d) > 50) go(index + (d < 0 ? 1 : -1));
        touchX.current = null;
      }}>
      <div className="gx-lb-top">
        <div><b>{title}</b><span>{index + 1} / {photos.length}</span></div>
        <div>
          <button type="button" className="gx-chip" onClick={onShare}>Share</button>
          <button type="button" className="gx-chip" onClick={onClose} aria-label="Close">✕</button>
        </div>
      </div>
      <div className="gx-lb-stage">
        <button type="button" className="gx-arrow" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous photo">←</button>
        <figure>
          <img src={p.src} alt={p.caption || title} />
          {p.caption && <figcaption>{p.caption}</figcaption>}
        </figure>
        <button type="button" className="gx-arrow" onClick={() => go(index + 1)} disabled={index === photos.length - 1} aria-label="Next photo">→</button>
      </div>
      <div className="gx-thumbs">
        {photos.map((t, n) => (
          <button type="button" key={n} className={n === index ? 'on' : ''} onClick={() => go(n)} aria-label={`Photo ${n + 1}`}>
            <img src={t.src} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}
