/**
 * Shop category SEO mapping.
 *
 * Categories come from the product catalogue (`p.category`), so new categories
 * added in the admin automatically get a category page — the slug is derived
 * from the name. `DISPLAY` gives each known category a keyword-rich title for
 * its page <title>/<h1> (e.g. "Climbing Harnesses, in Pakistan | Climb Crux");
 * unknown categories fall back to their own name.
 */

/** URL slug for a category name ("Belaying Devices" → "belaying-devices"). */
export function categorySlug(category) {
  return String(category).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Keyword-rich display title per category, used in page titles and h1s. */
const DISPLAY = {
  carabiners: 'Climbing Carabiners',
  harness: 'Climbing Harnesses',
  ropes: 'Climbing Ropes',
  helmets: 'Climbing Helmets',
  'quick-draws': 'Quickdraws',
  'belaying-devices': 'Belay Devices',
};

const KEYWORD = {
  carabiners: 'climbing carabiners',
  harness: 'climbing harnesses',
  ropes: 'climbing ropes',
  helmets: 'climbing helmets',
  'quick-draws': 'quickdraws',
  'belaying-devices': 'belay devices',
};

/** Title for the category page <title>/<h1>, e.g. "Climbing Harnesses in Pakistan". */
export function categoryTitle(category) {
  const slug = categorySlug(category);
  const display = DISPLAY[slug] || category;
  return `${display}`;
}

/** Meta description for a category page. */
export function categoryDescription(category) {
  const kw = KEYWORD[categorySlug(category)] || String(category).toLowerCase();
  return `Shop ${kw} in Pakistan at Climb Crux. Browse our range of ${kw} for rock climbing — quality gear for Margalla Hills crags and climbing walls, delivered across Pakistan.`;
}
