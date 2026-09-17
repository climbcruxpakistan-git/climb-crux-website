/**
 * Deterministic, URL-safe slugs.
 *
 * Used to build stable anchor ids for routes (e.g. "Dog's Dinner" →
 * "dogs-dinner") so the same name always resolves to the same fragment, in the
 * rendered cards and in structured data alike. No random or sequential parts,
 * so the id never changes between builds.
 */
export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
