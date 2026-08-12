/**
 * Order confirmation email — sent to the customer after an administrator
 * verifies their payment screenshot and confirms the equipment order.
 */
import { renderEmailLayout, referenceBox, statusChip, escapeHtml, summaryTable, whatsappLink } from './emailLayout.js'

const STATUS = 'Confirmed'

/** Display the WhatsApp number (see shared/contact.js) as "+92 XXX XXXXXXX" for the contact line. */
function displayNumber(number) {
  const digits = String(number || '').replace(/[^0-9]/g, '')
  if (digits.length >= 12) return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
  return String(number || '')
}

/**
 * @param {{ order: object, whatsapp: string }} props
 * @returns {{ subject: string, html: string }}
 */
export function orderConfirmedEmail({ order, whatsapp = '' }) {
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
    headerTitle: 'Order Confirmed',
    headerSubtitle: 'Your payment has been verified 🧗',
    greeting: `Hi ${escapeHtml((order.customer_name || 'there').split(' ')[0])},`,
    bodyHtml: `
      <p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.7">
        Great news — your payment has been <strong>verified</strong> and your
        equipment order is now <strong>confirmed</strong>. We'll update you as
        your order moves towards pickup or delivery.
      </p>
      ${referenceBox('Order ID', reference)}
      ${statusChip(STATUS)}
      <div style="margin:18px 0 4px;font-size:12px;font-weight:800;color:#1c1c1c;text-transform:uppercase;letter-spacing:0.06em">Order summary</div>
      ${summaryTable(rows)}
      <p style="margin:18px 0 0;font-size:14px;color:#444;line-height:1.7">
        A <strong>PDF copy of your confirmed order</strong> has been attached
        to this email for your records.
      </p>
      <p style="margin:14px 0 0;font-size:14px;color:#444;line-height:1.7">
        If you have any queries about your order, contact
        <strong>Team Climb Crux</strong> at
        <a href="${whatsappLink(whatsapp)}" style="color:#f36f21;font-weight:700;text-decoration:none">${displayNumber(whatsapp)}</a>.
      </p>
    `,
  })

  return {
    subject: 'Your Climb Crux Order Is Confirmed',
    html,
  }
}
