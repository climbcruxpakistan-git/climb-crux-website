export const CONDITIONS = ['Brand New', 'Almost New', 'Slightly Used', 'Used', 'Old']

export const CONDITION_CONFIG = {
  'Brand New':     { label: 'Brand New',     icon: 'circle-check', bg: '#E6F4EC', fg: '#1E7B4A' },
  'Almost New':    { label: 'Almost New',    icon: 'circle-check', bg: '#EEF3D6', fg: '#5A6B12' },
  'Slightly Used': { label: 'Slightly Used', icon: 'rotate-cw',    bg: '#FCF0D9', fg: '#8A5A12' },
  'Used':          { label: 'Used',          icon: 'rotate-cw',    bg: '#FDE6D3', fg: '#9A4A0F' },
  'Old':           { label: 'Old',           icon: 'history',      bg: '#F9DEDC', fg: '#A12B25' },
}

export function normalizeCondition(value) {
  const v = String(value || '').trim()
  if (!v) return ''
  if (CONDITION_CONFIG[v]) return v
  const map = {
    brand_new: 'Brand New',
    'brand new': 'Brand New',
    new: 'Brand New',
    almost_new: 'Almost New',
    'almost new': 'Almost New',
    almost_new_used: 'Almost New',
    'almost new - used': 'Almost New',
    slightly_used: 'Slightly Used',
    'slightly used': 'Slightly Used',
    'like new': 'Almost New',
    used: 'Used',
    old: 'Old',
  }
  return map[v.toLowerCase().replace(/\s+/g, ' ')] || map[v.toLowerCase().replace(/[\s-]+/g, '_')] || ''
}
