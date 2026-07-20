import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'
const NAV_SECTIONS = [
  {
    label: 'Main',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
    ],
  },
  {
    label: 'Content',
    links: [
      { to: '/home', label: 'Home Page', icon: '⊞' },
      { to: '/sessions', label: 'Sessions', icon: '⊡' },
      { to: '/private-premium', label: 'Private & Premium', icon: '✦' },
      { to: '/team', label: 'Team Members', icon: '⊙' },
      { to: '/gallery', label: 'Gallery', icon: '▦' },
      { to: '/photos', label: 'Photos', icon: '◧' },
      { to: '/about', label: 'About Page', icon: '⊕' },
    ],
  },
  {
    label: 'Operations',
    links: [
      { to: '/bookings', label: 'Bookings', icon: '☰' },
    ],
  },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [pageTitle, setPageTitle] = useState('Dashboard')

  useEffect(() => {
    const current = NAV_SECTIONS.flatMap((s) => s.links).find(
      (l) => l.to === location.pathname,
    )
    if (current) {
      setPageTitle(current.label)
    }
  }, [location])

  const pageTitles = {
    '/dashboard': 'Dashboard',
    '/home': 'Home Page',
    '/sessions': 'Public Sessions',
    '/private-premium': 'Private & Premium Plans',
    '/team': 'Team Members',
    '/gallery': 'Gallery',
    '/about': 'About Page',
    '/bookings': 'Bookings',
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Climb Crux" />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Climb Crux</span>
            <span className="sidebar-brand-badge">Admin Panel</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <span className="sidebar-label">{section.label}</span>
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    'sidebar-link' + (isActive ? ' is-active' : '')
                  }
                  end={link.to === '/dashboard'}
                >
                  <span className="sidebar-icon">{link.icon}</span>
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="sidebar-footer-link"
          >
            <span className="sidebar-icon">↗</span>
            <span>View Website</span>
          </a>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <h2 className="admin-header-title">
              {pageTitles[location.pathname] || 'Admin'}
            </h2>
          </div>
          <div className="admin-header-right">
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="btn-admin btn-admin-ghost btn-admin-sm"
            >
              View Site
            </a>
            <button
              onClick={logout}
              className="btn-admin btn-admin-ghost btn-admin-sm"
              title="Sign out"
            >
              Sign out
            </button>
            <div className="admin-avatar" title={user?.email || 'Admin'}>
              {(user?.email || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="admin-body">
          <Outlet />
        </div>
      </div>

    </div>
  )
}
