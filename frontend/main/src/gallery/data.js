import { getGallery, getUploads } from '../api.js';

/**
 * Gallery data shape.
 *
 * Collections are the admin categories, albums are the gallery items inside a
 * category, and an album's photos are the uploads tagged with that item's
 * `photoSlug` (falling back to the item's own image). Everything the views
 * render comes out of `buildCollections`, so there is one place that knows how
 * the API is put together.
 */
export const DEFAULT_CATEGORIES = ['Public Sessions', 'Private Sessions', 'Foreign Climber', 'High Grade Rock Climbing'];

export const slugify = (s) =>
  String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

export const countPhotos = (c) => c.albums.reduce((n, a) => n + a.photos.length, 0);
export const coverOf = (c) => c.cover ?? c.albums[0]?.photos[0]?.src;

const photoSrc = (p) => p.url || p.imageUrl || '';
const photoCaption = (p) => p.caption || p.title || '';

function uniqueSlug(slug, used) {
  const base = slug || 'album';
  let out = base;
  let n = 2;
  while (used.has(out)) out = `${base}-${n++}`;
  used.add(out);
  return out;
}

export function buildCollections(items = [], uploads = []) {
  // slug -> uploads tagged with it (computed once per collection load)
  const taggedPhotos = new Map();
  for (const item of items) {
    const slug = (item.photoSlug || '').trim().toLowerCase();
    if (!slug || taggedPhotos.has(slug)) continue;
    taggedPhotos.set(slug, uploads.filter((up) => (up.tags || []).some((t) => t.toLowerCase() === slug)));
  }

  const categories = [...new Set([...DEFAULT_CATEGORIES, ...items.map((i) => i.cat).filter(Boolean)])];

  return categories
    .map((cat) => {
      const used = new Set();
      const albums = items
        .filter((item) => item.cat === cat)
        .map((item) => {
          const slug = (item.photoSlug || '').trim().toLowerCase();
          const matches = slug ? taggedPhotos.get(slug) || [] : [];
          const photos = (matches.length ? matches : [item])
            .map((p) => ({ src: photoSrc(p), caption: photoCaption(p) }))
            .filter((p) => p.src);
          return { slug: uniqueSlug(slugify(item.tag), used), title: item.tag, photos };
        })
        .filter((a) => a.photos.length);
      return { slug: slugify(cat), title: cat, albums };
    })
    .filter((c) => c.albums.length);
}

/* View models — trimmed shapes handed to the views. */

export const toCollectionCard = (c) => ({
  slug: c.slug,
  title: c.title,
  cover: coverOf(c),
  albumCount: c.albums.length,
  photoCount: countPhotos(c),
});

// The gallery index shows these two collection previews on each other's cards.
const SWAPPED_COVERS = {
  'foreigner-climbers': 'high-grade-rock-climbing',
  'high-grade-rock-climbing': 'foreigner-climbers',
};

export const applyCoverSwaps = (cards) => {
  const bySlug = new Map(cards.map((c) => [c.slug, c]));
  return cards.map((c) => {
    const other = SWAPPED_COVERS[c.slug] ? bySlug.get(SWAPPED_COVERS[c.slug]) : null;
    return other?.cover ? { ...c, cover: other.cover } : c;
  });
};

export const toAlbumCard = (a) => ({
  slug: a.slug,
  title: a.title,
  cover: a.photos[0]?.src,
  photoCount: a.photos.length,
});

export const toCollectionView = (c) => ({
  slug: c.slug,
  title: c.title,
  cover: coverOf(c),
  albumCount: c.albums.length,
  photoCount: countPhotos(c),
  albums: c.albums.map(toAlbumCard),
});

/* Cached loader — one pair of API calls per session, shared by all routes. */

let pending = null;

export function loadCollections() {
  if (!pending) {
    pending = Promise.all([getGallery().catch(() => []), getUploads().catch(() => [])])
      .then(([items, uploads]) => buildCollections(items, uploads))
      .catch(() => []);
  }
  return pending;
}
