import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import './index.css'
import './layout.css'
import './shared.css'

// Re-fire GA4 pageviews on client-side route changes (SPA navigation).
// The inline gtag snippet in index.html handles the initial pageview, so
// we skip the first run to avoid double-counting.
function TrackPageViews() {
  const { pathname } = useLocation()
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    if (typeof window.gtag === 'function') {
      window.gtag('js', new Date())
      window.gtag('config', 'G-QTTHTK67QR')
    }
  }, [pathname])
  return null
}

import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Sessions from './pages/Sessions.jsx'
import PrivatePremium from './pages/PrivatePremium.jsx'
import About from './pages/About.jsx'
import OurTeam from './pages/OurTeam.jsx'
import InstructorProfile from './pages/InstructorProfile.jsx'
import Gallery from './pages/Gallery.jsx'
import BookNow from './pages/BookNow.jsx'
import MembershipApply from './pages/MembershipApply.jsx'
import Shop from './pages/Shop.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import PaymentPage from './pages/PaymentPage.jsx'
import BankTransferConfirmation from './pages/BankTransferConfirmation.jsx'
import EasyPaisaConfirmation from './pages/EasyPaisaConfirmation.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <TrackPageViews />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/private-premium" element={<PrivatePremium />} />
          <Route path="/about" element={<About />} />
          <Route path="/our-team" element={<OurTeam />} />
          <Route path="/our-team/:id" element={<InstructorProfile />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:id" element={<ProductDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/book-now" element={<BookNow />} />
          <Route path="/membership/apply" element={<MembershipApply />} />
          <Route path="/booking/:bookingNumber/payment" element={<PaymentPage />} />
          <Route path="/booking/:bookingNumber/bank-transfer-confirmation" element={<BankTransferConfirmation />} />
          <Route path="/booking/:bookingNumber/easypaisa-confirmation" element={<EasyPaisaConfirmation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
