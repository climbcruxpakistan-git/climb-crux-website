import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './layout.css'
import './shared.css'

import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Sessions from './pages/Sessions.jsx'
import PrivatePremium from './pages/PrivatePremium.jsx'
import About from './pages/About.jsx'
import OurTeam from './pages/OurTeam.jsx'
import InstructorProfile from './pages/InstructorProfile.jsx'
import Gallery from './pages/Gallery.jsx'
import BookNow from './pages/BookNow.jsx'
import PaymentPage from './pages/PaymentPage.jsx'
import BankTransferConfirmation from './pages/BankTransferConfirmation.jsx'
import EasyPaisaConfirmation from './pages/EasyPaisaConfirmation.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/private-premium" element={<PrivatePremium />} />
          <Route path="/about" element={<About />} />
          <Route path="/our-team" element={<OurTeam />} />
          <Route path="/our-team/:id" element={<InstructorProfile />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/book-now" element={<BookNow />} />
          <Route path="/booking/:bookingNumber/payment" element={<PaymentPage />} />
          <Route path="/booking/:bookingNumber/bank-transfer-confirmation" element={<BankTransferConfirmation />} />
          <Route path="/booking/:bookingNumber/easypaisa-confirmation" element={<EasyPaisaConfirmation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
