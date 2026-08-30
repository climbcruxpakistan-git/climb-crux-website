import { useEffect } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { WHATSAPP_DISPLAY } from '../../../../shared/contact.js'
import './ReturnRefundPolicy.css'

export default function ReturnRefundPolicy() {
  useEffect(() => {
    document.title = 'Return & Refund Policy | Climb Crux Pakistan'
  }, [])

  return (
    <>
      <PageHeader eyebrow="Legal" title="Return & Refund Policy">
        <p>Last Updated: August 30, 2026</p>
      </PageHeader>

      <section className="section policy-section">
        <div className="wrap policy-wrap">
          <section className="policy-block">
            <h2>1. Overview</h2>
            <p>
              This Return &amp; Refund Policy applies to all climbing equipment purchased through the
              official Climb Crux website.
            </p>
          </section>

          <section className="policy-block">
            <h2>2. Product Returns</h2>
            <p>Products may only be returned in the following cases:</p>
            <ul>
              <li>The product was damaged when received.</li>
              <li>The product is defective.</li>
              <li>The wrong product was received.</li>
            </ul>
          </section>

          <section className="policy-block">
            <h2>3. Non-Returnable Products</h2>
            <p>
              Climbing equipment is not eligible for return if the customer has used the equipment while
              climbing.
            </p>
            <p>
              Products that have been used, damaged through use, or show signs of use may not be accepted
              for return.
            </p>
          </section>

          <section className="policy-block">
            <h2>4. Return Time Limit</h2>
            <p>Return requests must be submitted within 7 days of receiving the order.</p>
            <p>Requests submitted after this period may not be accepted.</p>
          </section>

          <section className="policy-block">
            <h2>5. Return Shipping</h2>
            <p>
              If the return is approved, Climb Crux will provide instructions regarding the return of the
              product.
            </p>
            <p>
              The customer should not send the product back before contacting Climb Crux and receiving
              return instructions.
            </p>
          </section>

          <section className="policy-block">
            <h2>6. Refund Process</h2>
            <p>
              To request a return or refund, contact Climb Crux through our official WhatsApp number and
              provide:
            </p>
            <ul>
              <li>Your order details/order number</li>
              <li>A description of the issue</li>
              <li>Clear photographs or other proof showing the damage, defect, or incorrect product received</li>
            </ul>
            <p>Our team will review the request and determine whether the product qualifies for a return or refund.</p>
          </section>

          <section className="policy-block">
            <h2>7. Refund Timeline</h2>
            <p>
              Once the returned product has been received at the Climb Crux office and the return has been
              reviewed and approved, the refund will be processed within 7 days.
            </p>
            <p>The refund timeline begins from the date the returned product is received at the Climb Crux office.</p>
          </section>

          <section className="policy-block">
            <h2>8. How to Request a Return or Refund</h2>
            <p>Please contact Climb Crux through our official WhatsApp number:</p>
            <p className="policy-whatsapp">WhatsApp: <a href="https://wa.me/923350044403">{WHATSAPP_DISPLAY}</a></p>
            <p>Please provide your order number, explain the issue, and send clear photographs or other relevant proof.</p>
            <p>Our team will review your request and guide you through the next steps.</p>
          </section>

          <section className="policy-block">
            <h2>9. Contact Information</h2>
            <p>Climb Crux Pakistan</p>
            <p className="policy-whatsapp">Official WhatsApp: <a href="https://wa.me/923350044403">{WHATSAPP_DISPLAY}</a></p>
            <p>For any questions regarding returns or refunds, please contact us through our official WhatsApp number.</p>
          </section>
        </div>
      </section>
    </>
  )
}
