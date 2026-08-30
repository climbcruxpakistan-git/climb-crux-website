import { useEffect } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { WHATSAPP_DISPLAY } from '../../../../shared/contact.js'
import './TermsAndConditions.css'

export default function TermsAndConditions() {
  useEffect(() => {
    document.title = 'Terms & Conditions | Climb Crux Pakistan'
  }, [])

  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms & Conditions">
        <p>Last Updated: August 30, 2026</p>
      </PageHeader>

      <section className="section tcs-section">
        <div className="wrap tcs-wrap">
          <section className="tcs-block">
            <h2>1. General</h2>
            <p>
              These Terms &amp; Conditions govern your use of the Climb Crux website and your purchase of
              climbing equipment through the official Climb Crux website. By placing an order, you agree
              to these Terms &amp; Conditions.
            </p>
          </section>

          <section className="tcs-block">
            <h2>2. Products and Pricing</h2>
            <p>
              All product prices are listed in PKR and are subject to change at any time without notice.
              We take reasonable care to ensure that product descriptions, images and prices are accurate,
              however we cannot guarantee that all details are error-free.
            </p>
          </section>

          <section className="tcs-block">
            <h2>3. Orders</h2>
            <p>
              Once an order is placed, you will receive an order number for reference. All orders are
              subject to confirmation and availability. We reserve the right to refuse or cancel an order
              at our discretion.
            </p>
          </section>

          <section className="tcs-block">
            <h2>4. Payment</h2>
            <p>
              Payments are accepted via Bank Transfer or EasyPaisa. Your order is confirmed after payment
              is received and, where required, verified by our team.
            </p>
          </section>

          <section className="tcs-block">
            <h2>5. Shipping and Delivery</h2>
            <p>
              Delivery times and shipping availability are shown for each product. We aim to dispatch
              orders promptly, however delivery may be affected by factors outside our control.
            </p>
          </section>

          <section className="tcs-block">
            <h2>6. Returns and Refunds</h2>
            <p>
              Returns and refunds are handled in accordance with our Return &amp; Refund Policy. Please
              read the Return &amp; Refund Policy before purchasing.
            </p>
          </section>

          <section className="tcs-block">
            <h2>7. Liability</h2>
            <p>
              Climbing is an inherently risky activity. Climb Crux is not liable for any injury or loss
              arising from improper use of climbing equipment or from participation in climbing activities.
              Equipment must be inspected before each use.
            </p>
          </section>

          <section className="tcs-block">
            <h2>8. Contact</h2>
            <p>
              For any questions regarding these Terms &amp; Conditions, please contact us through our
              official WhatsApp number: <a className="tcs-contact" href="https://wa.me/923350044403">{WHATSAPP_DISPLAY}</a>.
            </p>
          </section>
        </div>
      </section>
    </>
  )
}
