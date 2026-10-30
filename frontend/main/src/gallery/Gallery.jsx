import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useSearchParams, Navigate } from "react-router-dom";
import { applyCoverSwaps, loadCollections, plural, toCollectionView } from "./data";
import "./gallery.css";

const collectionHref = (slug) => `/gallery/${slug}`;
const albumHref = (collection, album) => `/gallery/${collection}/${album}`;

function Card({ href, img, title, meta, className = "" }) {
  return (
    <Link to={href} className={`gx-card ${className}`}>
      {img ? <img src={img} alt="" loading="lazy" /> : <div className="gx-empty" />}
      <div className="gx-cap">
        <h3>{title}</h3>
        <p>{meta}</p>
      </div>
    </Link>
  );
}

function Loading() {
  return (
    <div className="gx">
      <div className="gx-wrap">
        <p className="gx-sub">Loading gallery…</p>
      </div>
    </div>
  );
}

function useCollections() {
  const [collections, setCollections] = useState(null);
  useEffect(() => {
    let active = true;
    loadCollections().then((c) => { if (active) setCollections(c); });
    return () => { active = false; };
  }, []);
  return collections;
}

/* ---------- /gallery ---------- */
export function GalleryHome() {
  const collections = useCollections();
  // Picking a collection in the rail opens its sub-categories (albums) in the
  // grid beside it instead of leaving the page.
  const [active, setActive] = useState(null);

  if (collections === null) return <Loading />;
  const list = applyCoverSwaps(collections.map(toCollectionView));
  const selected = active ? list.find((c) => c.slug === active) || null : null;

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
                  <Link to={collectionHref(c.slug)} className={`gx-rail-link${active === c.slug ? " on" : ""}`}
                    aria-current={active === c.slug ? "true" : undefined}
                    title={`${plural(c.albumCount, "album")} · ${plural(c.photoCount, "photo")}`}
                    onClick={(e) => { e.preventDefault(); setActive(active === c.slug ? null : c.slug); }}>
                    <span className="gx-rail-name">{c.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
          <div className="gx-pane">
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
                      title={a.title} meta={plural(a.photoCount, "photo")} />
                  ))}
                </div>
              </>
            ) : (
              <div className="gx-grid gx-feature">
                {list.length === 0 && <p className="gx-sub">No photos yet. Check back soon!</p>}
                {list.map((c) => (
                  <Card key={c.slug} href={collectionHref(c.slug)} img={c.cover} title={c.title}
                    meta={`${plural(c.albumCount, "album")} · ${plural(c.photoCount, "photo")}`} />
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
export function CollectionPage() {
  const collections = useCollections();
  const { collection } = useParams();

  if (collections === null) return <Loading />;
  const c = collections.find((x) => x.slug === collection);
  if (!c) return <Navigate to="/gallery" replace />;

  const view = toCollectionView(c);
  const nav = collections.map(({ slug, title }) => ({ slug, title }));

  return (
    <div className="gx">
      <div className="gx-wrap">
        <nav className="gx-crumb"><Link to="/gallery">Gallery</Link> / <b>{view.title}</b></nav>
        <h1 className="gx-title">{view.title}</h1>
        <p className="gx-sub">{plural(view.albumCount, "album")} · {plural(view.photoCount, "photo")}</p>
      </div>
      <div className="gx-wrap gx-split">
        <aside aria-label="Collections">
          <div className="gx-eyebrow dark">Collections</div>
          {nav.map((x) => (
            <Link key={x.slug} to={collectionHref(x.slug)} className={x.slug === view.slug ? "on" : ""}>{x.title}</Link>
          ))}
        </aside>
        <div className="gx-grid gx-feature-2">
          {view.albums.map((a) => (
            <Card key={a.slug} href={albumHref(view.slug, a.slug)} img={a.cover}
              title={a.title} meta={plural(a.photoCount, "photo")} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- /gallery/:collection/:album ---------- */
export function AlbumPage() {
  const collections = useCollections();
  const { collection, album } = useParams();
  const [params, setParams] = useSearchParams();

  if (collections === null) return <Loading />;

  const c = collections.find((x) => x.slug === collection);
  const i = c ? c.albums.findIndex((a) => a.slug === album) : -1;
  if (!c || i < 0) return <Navigate to="/gallery" replace />;

  const a = c.albums[i];
  const prev = c.albums[i - 1];
  const next = c.albums[i + 1];
  const open = params.has("photo") ? Number(params.get("photo")) : null;
  const setOpen = (n) => setParams(n == null ? {} : { photo: n }, { replace: n != null });

  const share = () =>
    navigator.share ? navigator.share({ title: a.title, url: location.href }) : navigator.clipboard.writeText(location.href);

  return (
    <div className="gx">
      <div className="gx-wrap">
        <nav className="gx-crumb">
          <Link to="/gallery">Gallery</Link> / <Link to={collectionHref(c.slug)}>{c.title}</Link> / <b>{a.title}</b>
        </nav>
        <div className="gx-row">
          <div>
            <h1 className="gx-title">{a.title}</h1>
            <p className="gx-sub">{plural(a.photos.length, "photo")}</p>
          </div>
          <button type="button" className="gx-ghost" onClick={share}>Share</button>
        </div>
        <div className="gx-photos">
          {a.photos.map((p, n) => (
            <button type="button" key={n} className="gx-tile" onClick={() => setOpen(n)}
              aria-label={`Open photo ${n + 1}: ${p.caption || a.title}`}>
              <img src={p.src} alt={p.caption || a.title} loading="lazy" />
              <span className="gx-num">{n + 1} / {a.photos.length}</span>
              {p.caption && <span className="gx-tcap">{p.caption}</span>}
            </button>
          ))}
        </div>
        <div className="gx-pn">
          {prev
            ? <Link to={albumHref(c.slug, prev.slug)}><small>← Previous album</small><b>{prev.title}</b></Link>
            : <span />}
          {next
            ? <Link to={albumHref(c.slug, next.slug)} style={{ textAlign: "right" }}><small>Next album →</small><b>{next.title}</b></Link>
            : <span />}
        </div>
      </div>
      {/* Portalled to <body> so the fixed overlay is sized to the viewport
          rather than to any transformed page wrapper. */}
      {open != null && a.photos[open] &&
        createPortal(
          <Lightbox title={a.title} photos={a.photos} index={open}
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
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = "";
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
          <button type="button" key={n} className={n === index ? "on" : ""} onClick={() => go(n)} aria-label={`Photo ${n + 1}`}>
            <img src={t.src} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}
