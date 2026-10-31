const RE = /^(\d+)([a-c])(\+)?$/i;

/** beginner (4–5) · intermediate (6a–6b) · advanced (6b+–6c+) · expert (7a+) */
export function bandOf(grade) {
  const m = RE.exec(String(grade ?? '').trim());
  if (!m) return 'advanced';
  const n = Number(m[1]);
  if (n < 6) return 'beginner';
  if (n >= 7) return 'expert';
  return ['6a', '6a+', '6b'].includes(`${m[1]}${m[2].toLowerCase()}${m[3] || ''}`) ? 'intermediate' : 'advanced';
}

export const BAND_LABEL = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};
