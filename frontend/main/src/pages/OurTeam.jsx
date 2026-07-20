import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PlaceholderPhoto from '../components/PlaceholderPhoto.jsx'
import { getTeam } from '../api.js'
import './OurTeam.css'

export default function OurTeam() {
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTeam()
      .then(setInstructors)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <section className="section">
        <div className="wrap">
          <h2>Who's holding your rope</h2>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--stone)' }}>Loading team…</p>
          ) : (
            <div className="instructor-grid">
              {instructors.map((i) => {
                const profileId = i.id || i._id
                return (
                  <Link to={`/our-team/${profileId}`} key={profileId} className="instructor-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                    <div className="instructor-photo-wrap">
                      {i.photoUrl ? (
                        <img src={i.photoUrl} alt={i.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <PlaceholderPhoto tag="Instructor photo" ratio="1 / 1" />
                      )}
                    </div>
                    <div className="instructor-body">
                      <span className="instructor-role-tag">{i.tag}</span>
                      <h4>{i.name}</h4>
                      <span className="instructor-subtitle">{i.role}</span>
                      <p>{i.bio}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
