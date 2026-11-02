import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { applyCoverSwaps, plural } from './data';

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
  const list = applyCoverSwaps(collections);
  // Picking a collection in the rail opens its sub-categories (albums) in the
  // grid beside it instead of leaving the page.
  const [active, setActive] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const selected = active ? list.find((c) => c.slug === active) || null : null;

  // Same open/close behaviour as the shop filters drawer: body scroll lock,
  // Escape closes, and resizing up to the tab-row width closes the sheet.
  useEffect(() => {
    if (!filtersOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setFiltersOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 640) setFiltersOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [filtersOpen]);

  return (
    <div className="gx">
      <header className="gx-hero">
        <div className="gx-inner">
          <h1>From the wall.</h1>
          <p>A running record of sessions on Margalla Hills. Public climbs, Private coaching and Group Training.</p>
        </div>
      </header>
      <section className="gx-wrap gx-home">
        <div className="gx-split">
          <aside className="gx-rail" aria-label="Collections">
            <div className="gx-rail-head">
              <h2 className="gx-rail-title">Collections</h2>
              <button type="button" className="gx-rail-close" onClick={() => setActive(null)} aria-label="Clear collection">×</button>
            </div>
            <ul className="gx-rail-list">
              {list.map((c) => (
                <li key={c.slug}>
                  <a href={collectionHref(c.slug)} className={`gx-rail-link${active === c.slug ? ' on' : ''}`}
                    aria-current={active === c.slug ? 'true' : undefined}
                    title={`${plural(c.albumCount, 'album')} · ${plural(c.photoCount, 'photo')}`}
                    onClick={(e) => { e.preventDefault(); setActive(active === c.slug ? null : c.slug); }}>
                    <span className="gx-rail-name">{c.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>
          <div className="gx-pane">
            {/* Mobile-only collections filter — the same sheet/drawer the shop
                page uses (Shop.css), replacing the horizontal tab row on phones. */}
            <div className="gx-mobile-filter">
              <button
                type="button"
                className="sp-filter-toggle"
                onClick={() => setFiltersOpen(true)}
                aria-expanded={filtersOpen}
                aria-controls="gx-collections-filter"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                  <circle cx="9" cy="6" r="2" fill="var(--chalk)" />
                  <circle cx="15" cy="12" r="2" fill="var(--chalk)" />
                  <circle cx="8" cy="18" r="2" fill="var(--chalk)" />
                </svg>
                Filter
                {selected && <span className="sp-filter-count">1</span>}
              </button>
              {selected && (
                <button
                  type="button"
                  className="gx-filter-chip"
                  onClick={() => setActive(null)}
                  aria-label={`Remove the ${selected.title} filter`}
                >
                  {selected.title} <span aria-hidden="true">×</span>
                </button>
              )}
              <button
                type="button"
                className="gx-clear-link"
                onClick={() => setActive(null)}
                disabled={!selected}
              >
                Clear
              </button>
            </div>
            <p className="gx-results" role="status">
              {selected
                ? <><b>{selected.albums.length}</b> {selected.albums.length === 1 ? 'album' : 'albums'} in {selected.title}</>
                : <><b>{list.length}</b> {list.length === 1 ? 'collection' : 'collections'}</>}
            </p>

            {filtersOpen && (
              <div className="sp-drawer-overlay" onClick={() => setFiltersOpen(false)} aria-hidden="true" />
            )}
            <aside
              id="gx-collections-filter"
              className={`sp-sidebar ${filtersOpen ? 'is-open' : ''}`}
              aria-label="Collection filters"
            >
              <div className="sp-sidebar-head">
                <h2 className="sp-sidebar-title">
                  Collections
                  {selected && <span className="sp-filter-count">1</span>}
                </h2>
                <button type="button" className="sp-clear" onClick={() => setActive(null)} disabled={!selected}>
                  Clear
                </button>
                <button
                  type="button"
                  className="sp-sidebar-close"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close filters"
                >
                  ×
                </button>
              </div>
              <div className="sp-filter-group">
                <h3 className="sp-filter-title">Collection</h3>
                <ul className="sp-cat-list">
                  <li>
                    <button
                      type="button"
                      className={`sp-cat${!selected ? ' is-active' : ''}`}
                      onClick={() => { setActive(null); setFiltersOpen(false); }}
                    >
                      <span>All</span>
                      <span className="sp-cat-count">{list.length}</span>
                    </button>
                  </li>
                  {list.map((c) => (
                    <li key={c.slug}>
                      <button
                        type="button"
                        className={`sp-cat${selected?.slug === c.slug ? ' is-active' : ''}`}
                        onClick={() => { setActive(c.slug); setFiltersOpen(false); }}
                      >
                        <span>{c.title}</span>
                        <span className="sp-cat-count">{c.albumCount}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                className="btn btn-primary sp-drawer-apply"
                onClick={() => setFiltersOpen(false)}
              >
                {selected
                  ? `Show ${plural(selected.albums.length, 'album')}`
                  : `Show all ${plural(list.length, 'collection')}`}
              </button>
            </aside>

            {selected ? (
              <>
                <div className="gx-folder-head">
                  <p className="gx-crumb">Gallery / <b>{selected.title}</b></p>
                  <button type="button" className="gx-ghost" onClick={() => setActive(null)}>← All collections</button>
                </div>
                <div className="gx-grid gx-feature-2">
                  {selected.albums.length === 0 && <p className="gx-sub">No albums in this collection yet.</p>}
                  {selected.albums.map((a) => (
                    <Card key={a.slug} href={albumHref(selected.slug, a.slug)} img={a.cover}
                      title={a.title} meta={plural(a.photoCount, 'photo')} />
                  ))}
                </div>
              </>
            ) : (
              <div className="gx-grid gx-feature">
                {list.length === 0 && <p className="gx-sub">No photos yet. Check back soon!</p>}
                {list.map((c) => (
                  <Card key={c.slug} href={collectionHref(c.slug)} img={c.cover} title={c.title}
                    meta={`${plural(c.albumCount, 'album')} · ${plural(c.photoCount, 'photo')}`} />
                ))}
              </div>
            )}
          </div>
        </div>
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
      {/* Portalled to <body>: the page wrapper is transformed by its fade-in
          animation, which would otherwise anchor this fixed overlay to <main>
          instead of the viewport. */}
      {open != null && album.photos[open] && typeof document !== 'undefined' &&
        createPortal(
          <Lightbox title={album.title} photos={album.photos} index={open}
            onChange={setOpen} onClose={() => setOpen(null)} onShare={share} />,
          document.body,
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
