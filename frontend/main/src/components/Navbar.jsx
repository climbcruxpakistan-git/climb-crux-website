import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/sessions', label: 'Public Sessions' },
  { to: '/private-premium', label: 'Private & Premium' },
  { to: '/our-team', label: 'Our Team' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location])

  return (
    <header className="navbar">
      <div className="wrap navbar-inner">
        <NavLink to="/" className="navbar-brand" aria-label="Climb Crux home">
          <img src="/logo.png" alt="Climb Crux" />
        </NavLink>

        <button
          className={`navbar-toggle ${open ? 'is-open' : ''}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`navbar-links ${open ? 'is-open' : ''}`}>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 'navbar-link' + (isActive ? ' is-active' : '')}
              end={link.to === '/'}
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/book-now" className="btn btn-primary navbar-cta">
            Book Now
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
