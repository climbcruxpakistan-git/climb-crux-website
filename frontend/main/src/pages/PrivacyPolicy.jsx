import { useEffect } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { WHATSAPP_DISPLAY } from '../../../../shared/contact.js'
import './PrivacyPolicy.css'

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy | Climb Crux Pakistan'
  }, [])

  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy">
        <p>Last Updated: August 30, 2026</p>
      </PageHeader>

      <section className="section pp-section">
        <div className="wrap pp-wrap">
          <section className="pp-block">
            <h2>1. Information We Collect</h2>
            <p>
              When you place an order or make an enquiry through the Climb Crux website, we may collect
              your name, phone number, email address and delivery address. This information is used to
              process orders, provide customer support and keep you informed about your purchases.
            </p>
          </section>

          <section className="pp-block">
            <h2>2. How We Use Your Information</h2>
            <p>
              We use the information you provide to fulfil orders, process payments, respond to enquiries
              and improve our services. We do not sell or rent your personal information to third parties.
            </p>
          </section>

          <section className="pp-block">
            <h2>3. Data Security</h2>
            <p>
              We take reasonable measures to protect your personal information from unauthorised access,
              use or disclosure. However, no method of transmission over the internet is completely secure.
            </p>
          </section>

          <section className="pp-block">
            <h2>4. Sharing of Information</h2>
            <p>
              We only share your information with third parties where necessary to provide our services,
              such as payment processing and order delivery, or where required by law.
            </p>
          </section>

          <section className="pp-block">
            <h2>5. Contact</h2>
            <p>
              For any questions about this Privacy Policy, please contact us through our official WhatsApp
              number: <a className="pp-contact" href="https://wa.me/923350044403">{WHATSAPP_DISPLAY}</a>.
            </p>
          </section>
        </div>
      </section>
    </>
  )
}
