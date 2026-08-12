/**
 * Shared membership form definitions — the Microsoft Word membership form is
 * the single source of truth for this wording. Kept in one module so the
 * online form and validation never drift apart.
 */

export const MEMBERSHIP_PLAN = 'Climb Crux Monthly Membership Form (4 Sessions)'
export const MEMBERSHIP_FEE = 'PKR 8,000 / Month'

/** Membership Terms & Conditions — every box must be ticked. */
export const TERMS = [
  'I understand that this membership includes four (4) guided climbing sessions per month.',
  'I understand that unused sessions cannot be carried forward to the next month (unless cancelled or postponed by the Climb Crux).',
  'I understand that this membership is non-transferable.',
  'I agree to follow all instructions given by Climb Crux instructors and staff.',
  'I understand that rock climbing involves inherent risks, including the risk of injury. I voluntarily choose to participate, accept these risks and agree not to hold Climb Crux, its instructors, staff or volunteers responsible for any injury or loss resulting from my participation.',
  'I confirm that I am physically fit to participate or have informed Climb Crux of any medical conditions.',
  'I have read, understood and agree to the Climb Crux Liability Waiver and Terms & Conditions.',
]

/** Member Declaration. */
export const DECLARATION =
  'I confirm that the information provided in this form is true and accurate to the best of my knowledge. I agree to comply with all Climb Crux rules, safety procedures and membership policies.'

/** Signature confirmation wording. */
export const SIGNATURE_CONFIRMATION =
  'I confirm that my typed name constitutes my electronic signature.'

/** Payment account details shown to applicants. */
export const BANK_DETAILS = {
  bank: 'Bank Al Habib Limited',
  account_name: 'CLIMB CRUX',
  iban: 'PK93 BAHL 5742 0081 0003 9501',
}

export const EASYPAISA_DETAILS = {
  account_name: 'Saif Ud Din',
  account_number: '0313 2690377',
}

/** File upload rules. */
export const UPLOAD_RULES = {
  accept: 'application/pdf,image/jpeg,image/png',
  extensions: ['pdf', 'jpg', 'jpeg', 'png'],
  maxSizeMB: 5,
}

/* ── Validation helpers ── */

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

export function isValidPhone(value) {
  const digits = String(value || '').replace(/[^\d]/g, '')
  // Pakistani numbers: 10-13 digits (e.g. 0313 2690377, +92 335 0044403)
  return digits.length >= 10 && digits.length <= 13
}

/** Returns age in years for a YYYY-MM-DD date string, or null if invalid. */
export function computeAge(dob) {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1
  return age
}

/** Validate a single uploaded file against the upload rules. */
export function validateFile(file, maxSizeMB = UPLOAD_RULES.maxSizeMB) {
  if (!file) return { ok: false, error: 'A file is required' }
  const name = (file.name || '').toLowerCase()
  const ext = name.split('.').pop()
  if (!UPLOAD_RULES.extensions.includes(ext)) {
    return { ok: false, error: 'Only PDF, JPG, JPEG or PNG files are allowed' }
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { ok: false, error: `File must be ${maxSizeMB} MB or smaller` }
  }
  return { ok: true }
}
