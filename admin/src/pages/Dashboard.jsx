import { useState, useEffect } from 'react'
import { getSessions, getTeam, getBookings, getGallery } from '../store.js'

export default function Dashboard() {
  const [sessions, setSessions] = useState([])
  const [team, setTeam] = useState([])
  const [bookings, setBookings] = useState([])
  const [gallery, setGallery] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSessions(), getTeam(), getBookings(), getGallery()])
      .then(([s, t, b, g]) => {
        setSessions(s)
        setTeam(t)
        setBookings(b)
        setGallery(g)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    {
      label: 'Total Sessions',
      value: sessions.length,
      icon: '⊡',
      color: 'orange',
      detail: `${sessions.filter((s) => s.spots !== 'Open').length} with limited spots`,
    },
    {
      label: 'Active Team Members',
      value: team.length,
      icon: '⊙',
      color: 'green',
      detail: `${team.filter((t) => t.role).length} instructors`,
    },
    {
      label: 'Gallery Photos',
      value: gallery.length,
      icon: '▦',
      color: 'blue',
      detail: `${new Set(gallery.map((g) => g.cat)).size} categories`,
    },
    {
      label: 'Total Bookings',
      value: bookings.length,
      icon: '☰',
      color: 'purple',
      detail: `${bookings.filter((b) => b.status === 'pending').length} pending`,
    },
  ]

  const recentBookings = bookings.slice(-5).reverse()
  const pastActivities = [
    { text: 'Website deployed to production', time: '2 hours ago' },
    { text: 'New booking from Sarah Ahmed', time: '4 hours ago' },
    { text: 'Public session updated — Aug 30', time: '1 day ago' },
    { text: 'New team member profile added', time: '2 days ago' },
    { text: 'Gallery photos reorganized', time: '3 days ago' },
  ]

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Loading dashboard…</h3>
      </div>
    )
  }

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Dashboard</h1>
          <p className="page-header-admin-desc">
            Overview of your Climb Crux website content.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card ${stat.color}`}>
            <div className="stat-card-icon">{stat.icon}</div>
            <span className="stat-card-value">{stat.value}</span>
            <span className="stat-card-label">{stat.label}</span>
            <span className="stat-card-change up">{stat.detail}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card-admin">
          <div className="card-admin-header">
            <h2>Recent Bookings</h2>
          </div>
          {recentBookings.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <p>No bookings yet.</p>
            </div>
          ) : (
            <div className="activity-list">
              {recentBookings.map((b, i) => (
                <div className="booking-item" key={i}>
                  <div className="booking-avatar">
                    {b.name ? b.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="booking-info">
                    <div className="booking-name">{b.name || 'Unknown'}</div>
                    <div className="booking-detail">
                      {b.type?.replace(/-/g, ' ') || 'No type'} · {b.date || 'No date'}
                    </div>
                  </div>
                  <span className={`badge ${b.status === 'confirmed' ? 'badge-green' : b.status === 'cancelled' ? 'badge-red' : 'badge-yellow'}`}>
                    {b.status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-admin">
          <div className="card-admin-header">
            <h2>Recent Activity</h2>
          </div>
          <div className="activity-list">
            {pastActivities.map((a, i) => (
              <div className="activity-item" key={i}>
                <div className="activity-dot" />
                <div className="activity-content">
                  <div className="activity-text">{a.text}</div>
                  <div className="activity-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
