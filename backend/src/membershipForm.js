/**
 * Shared membership form definitions.
 * The Microsoft Word membership form is the single source of truth for this
 * wording — keep these strings in sync with it (and with the online form).
 */

export const MEMBERSHIP_PLAN = 'Climb Crux Monthly Membership Form (4 Sessions)'
export const MEMBERSHIP_FEE = 'PKR 8,000 / Month'

/** Membership Terms & Conditions — every box must be ticked. */
export const MEMBERSHIP_TERMS = [
  'I understand that this membership includes four (4) guided climbing sessions per month.',
  'I understand that unused sessions cannot be carried forward to the next month (unless cancelled or postponed by the Climb Crux).',
  'I understand that this membership is non-transferable.',
  'I agree to follow all instructions given by Climb Crux instructors and staff.',
  'I understand that rock climbing involves inherent risks, including the risk of injury. I voluntarily choose to participate, accept these risks and agree not to hold Climb Crux, its instructors, staff or volunteers responsible for any injury or loss resulting from my participation.',
  'I confirm that I am physically fit to participate or have informed Climb Crux of any medical conditions.',
  'I have read, understood and agree to the Climb Crux Liability Waiver and Terms & Conditions.',
]

/** Session Booking Terms & Conditions — every box must be ticked before the
 * customer can proceed to the payment page (Public / Starter Private / Advanced
 * Private sessions). The same wording appears on the booking PDF. */
export const BOOKING_TERMS = [
  'I agree to follow all instructions given by Climb Crux instructors and staff.',
  'I understand that rock climbing involves inherent risks, including the risk of injury. I voluntarily choose to participate, accept these risks and agree not to hold Climb Crux, its instructors, staff or volunteers responsible for any injury or loss resulting from my participation.',
  'I have read, understood and agree to the Climb Crux Liability Waiver and Terms & Conditions.',
]

/** Member Declaration. */
export const MEMBERSHIP_DECLARATION =
  'I confirm that the information provided in this form is true and accurate to the best of my knowledge. I agree to comply with all Climb Crux rules, safety procedures and membership policies.'

/** Bank transfer account details shown to applicants. */
export const BANK_DETAILS = {
  bank: 'Bank Al Habib Limited',
  account_name: 'CLIMB CRUX',
  iban: 'PK93 BAHL 5742 0081 0003 9501',
}

/** EasyPaisa account details shown to applicants. */
export const EASYPAISA_DETAILS = {
  account_name: 'Saif Ud Din',
  account_number: '0313 2690377',
}
