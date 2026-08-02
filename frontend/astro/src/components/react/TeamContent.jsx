import { useState, useEffect } from 'react'
import { getTeam } from '../../lib/api'

export default function TeamContent({ initial }) {
  const [instructors, setInstructors] = useState(initial || [])

  useEffect(() => {
    let active = true
    getTeam()
      .then((team) => {
        if (active) setInstructors(team)
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  return (
    <section className="section">
      <div className="wrap">
        <h2>Who's holding your rope</h2>
        <div className="instructor-grid">
          {instructors.map((i) => {
            const profileId = i.id || i._id
            return (
              <a href={`/our-team/${profileId}`} className="instructor-card" key={profileId}>
                <div className="instructor-photo-wrap">
                  {i.photoUrl ? (
                    <img src={i.photoUrl} alt={i.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="placeholder-photo" style={{ '--ar': '1 / 1' }}>
                      <span className="tag">Instructor photo</span>
                    </div>
                  )}
                </div>
                <div className="instructor-body">
                  <h4>{i.name}</h4>
                  <span className="instructor-subtitle">{i.role}</span>
                  <p>{i.bio}</p>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
