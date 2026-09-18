import { useEffect } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { WHATSAPP_DISPLAY } from '../../../../shared/contact.js'
import './ShippingPolicy.css'

export default function ShippingPolicy() {
  useEffect(() => {
    document.title = 'Shipping Policy | Climb Crux Pakistan'
  }, [])

  return (
    <>
      <PageHeader eyebrow="Legal" title="Shipping Policy">
        <p>Last Updated: August 30, 2026</p>
      </PageHeader>

      <section className="section sp-section">
        <div className="wrap sp-wrap">
          <section className="sp-block">
            <h2>1. Processing Time</h2>
            <p>
              Orders are processed and dispatched after payment is received and, where required, verified by
              our team. Processing typically takes 1–2 business days.
            </p>
          </section>

          <section className="sp-block">
            <h2>2. Delivery</h2>
            <p>
              Delivery times are shown for each product at checkout and may vary depending on your location.
              Please provide an accurate delivery address to avoid delays. Climb Crux is not responsible for
              delays caused by factors outside our control.
            </p>
          </section>

          <section className="sp-block">
            <h2>3. Shipping Costs</h2>
            <p>
              Shipping costs, if any, are shown at checkout before you confirm your order. FREE SHIPPING
              on orders over PKR 10,000, Only if Shipping charges are up to PKR 1,000.
            </p>
          </section>

          <section className="sp-block">
            <h2>4. Damaged or Incorrect Shipments</h2>
            <p>
              If your order arrives damaged, defective or incorrect, please contact us within 7 days of receipt
              in accordance with our Return &amp; Refund Policy.
            </p>
          </section>

          <section className="sp-block">
            <h2>5. Contact</h2>
            <p>
              For any questions about shipping, please contact us through our official WhatsApp number:{' '}
              <a className="sp-contact" href="https://wa.me/923350044403">{WHATSAPP_DISPLAY}</a>.
            </p>
          </section>
        </div>
      </section>
    </>
  )
}
