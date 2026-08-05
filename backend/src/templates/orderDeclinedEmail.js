/**
 * Order decline email — sent to the customer when an administrator cannot
 * approve their payment. Includes the reason the admin selected/entered.
 */
import { renderEmailLayout, referenceBox, statusChip, escapeHtml, summaryTable, whatsappLink } from './emailLayout.js'

const STATUS = 'Declined'

/** Suggested decline reasons shown in the admin dashboard. */
export const ORDER_DECLINE_REASONS = [
  { value: 'payment_not_received', label: 'Payment Not Received' },
  { value: 'incorrect_amount', label: 'Incorrect Payment Amount' },
  { value: 'invalid_screenshot', label: 'Invalid Payment Screenshot' },
  { value: 'other', label: 'Other' },
]

/** Human-readable version of a stored decline reason. */
export function declineReasonLabel(reason) {
  const found = ORDER_DECLINE_REASONS.find((r) => r.value === reason)
  if (found) return found.label
  return reason || '—'
}

/** Display "+923132690377" as "+92 313 2690377" for the contact line. */
function displayNumber(number) {
  const digits = String(number || '').replace(/[^0-9]/g, '')
  if (digits.length >= 12) return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
  return String(number || '')
}

/**
 * @param {{ order: object, reason: string, whatsapp: string }} props
 * @returns {{ subject: string, html: string }}
 */
export function orderDeclinedEmail({ order, reason = '', whatsapp = '' }) {
  const reference = order.order_number || '—'

  const rows = [
    ['Customer', order.customer_name || '—'],
    ['Product', order.product_name || '—'],
    ['Quantity', String(order.quantity || 1)],
    ['Total', `PKR ${(order.total_amount || 0).toLocaleString()}`],
    ['Payment Method', order.payment_method === 'bank_transfer' ? 'Bank Transfer' : order.payment_method === 'easypaisa' ? 'EasyPaisa' : '—'],
    ['Status', STATUS],
  ]

  const html = renderEmailLayout({
    headerTitle: 'Order Declined',
    headerSubtitle: 'An update on your equipment order',
    greeting: `Hi ${escapeHtml((order.customer_name || 'there').split(' ')[0])},`,
    bodyHtml: `
      <p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.7">
        Unfortunately, we were unable to verify the payment for your order, so
        it has been <strong>declined</strong>.
      </p>
      <div style="margin:14px 0 0;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px">
        <div style="font-size:11px;color:#b91c1c;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;font-weight:700">Reason</div>
        <div style="font-size:14px;color:#7f1d1d;font-weight:600">${escapeHtml(declineReasonLabel(reason))}</div>
      </div>
      ${referenceBox('Order ID', reference)}
      ${statusChip(STATUS)}
      <div style="margin:18px 0 4px;font-size:12px;font-weight:800;color:#1c1c1c;text-transform:uppercase;letter-spacing:0.06em">Order summary</div>
      ${summaryTable(rows)}
      <p style="margin:18px 0 0;font-size:14px;color:#444;line-height:1.7">
        A PDF copy of your order has been attached to this email for your
        records.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:18px 0 0">
        <tr>
          <td style="padding:0;text-align:center">
            <a href="https://climbcruxpakistan.com/shop" style="display:inline-block;background:#f36f21;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:8px">Browse the Shop</a>
          </td>
        </tr>
      </table>
      <p style="margin:14px 0 0;font-size:14px;color:#444;line-height:1.7">
        If you believe this is a mistake or have any queries, contact
        <strong>Team Climb Crux</strong> at
        <a href="${whatsappLink(whatsapp)}" style="color:#f36f21;font-weight:700;text-decoration:none">${displayNumber(whatsapp)}</a>.
      </p>
    `,
  })

  return {
    subject: 'Update on Your Climb Crux Order',
    html,
  }
}
