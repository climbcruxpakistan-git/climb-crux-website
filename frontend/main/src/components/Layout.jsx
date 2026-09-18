import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import ShopAnnouncementBar from './ShopAnnouncementBar.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function Layout() {
  const { pathname } = useLocation()
  const isShop = pathname === '/shop' || pathname.startsWith('/shop/')
  return (
    <>
      <ScrollToTop />
      <Navbar />
      {isShop && <ShopAnnouncementBar />}
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
