import { useState, useEffect } from 'react'
import { getTeam } from '../../lib/api'

function jsonParse(str) {
  try { return str ? JSON.parse(str) : null } catch { return null }
}

export default function InstructorProfile({ id, initialInstructor }) {
  const parsedInitial = jsonParse(initialInstructor)
  const [instructor, setInstructor] = useState(parsedInitial)
  const [loading, setLoading] = useState(!parsedInitial)

  useEffect(() => {
    if (parsedInitial) {
      // Background refresh without loading state
      getTeam()
        .then((members) => {
          const found = members.find((m) => (m.id || m._id) === id)
          if (found) setInstructor(found)
        })
        .catch(() => {})
      return
    }
    getTeam()
      .then((members) => {
        const found = members.find((m) => (m.id || m._id) === id)
        setInstructor(found || null)
      })
      .catch(() => setInstructor(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <section className="section" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--stone)' }}>Loading profile…</p>
      </section>
    )
  }

  if (!instructor) {
    return (
      <section className="section" style={{ textAlign: 'center' }}>
        <h2>Instructor not found</h2>
        <a href="/our-team" className="btn btn-outline" style={{ marginTop: 16 }}>← Back to team</a>
      </section>
    )
  }

  return (
    <>
      {/* Mobile responsive style */}
      <style>{`
        @media (max-width: 760px) {
          .ip-hero .ip-grid { grid-template-columns: 1fr !important; gap: 24px; }
        }
      `}</style>

      <section className="ip-hero" style={{ background: 'linear-gradient(135deg, var(--charcoal-deep), var(--charcoal))', color: 'var(--chalk)', position: 'relative' }}>
        <div className="wrap ip-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 48, alignItems: 'start', paddingTop: 48, paddingBottom: 64 }}>
          <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
            {instructor.photoUrl ? (
              <img src={instructor.photoUrl} alt={instructor.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div className="placeholder-photo" style={{ aspectRatio: '1', background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 14px), linear-gradient(155deg, var(--charcoal) 0%, #2c2b2d 55%, var(--orange-dark) 140%)', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                <span className="tag" style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.72rem', padding: '14px 16px', color: 'var(--chalk-dim)', opacity: 0.85 }}>Instructor photo</span>
              </div>
            )}
          </div>
          <div>
            <a href="/our-team" className="btn btn-outline-light" style={{ marginBottom: 24, display: 'inline-flex' }}>← Back to team</a>
            <h1 style={{ color: 'var(--chalk)', fontSize: 'clamp(2rem, 4vw, 3rem)', marginTop: 12, marginBottom: 4 }}>{instructor.name}</h1>
            <p style={{ color: 'var(--orange-light)', fontSize: '1.1rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 20 }}>{instructor.role}</p>
            <p style={{ color: '#c9c4b8', fontSize: '1.02rem', maxWidth: '56ch', lineHeight: 1.7 }}>{instructor.bio}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {instructor.instagram && (
                <a href={instructor.instagram} target="_blank" rel="noreferrer" className="btn btn-outline-light" style={{ fontSize: '0.78rem', padding: '0.6em 1.2em' }}>Instagram</a>
              )}
              {instructor.climbingProfile && (
                <a href={instructor.climbingProfile} target="_blank" rel="noreferrer" className="btn btn-outline-light" style={{ fontSize: '0.78rem', padding: '0.6em 1.2em' }}>View climbing profile</a>
              )}
            </div>
          </div>
        </div>
        <svg className="cliff-edge" viewBox="0 0 1440 56" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 40 }}>
          <path d="M0 56V33.6C142.9 41.8 299.6 47.5 446 49.2 617.5 51.2 758.3 42.4 899 33.6 1025.6 25.8 1152.3 18 1440 37.6V56z" fill="var(--chalk)" />
          <path d="M0 56V44.8c96-8 205-13.6 307-14.8 151-1.8 297 4.6 443 11 130 5.6 260 11.2 400 10 108-.8 200-4.2 290-8.8v25.6z" fill="var(--chalk)" opacity="0.6" />
        </svg>
      </section>

      <section className="section">
        <div className="wrap">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
            {instructor.certifications?.length > 0 && (
              <div className="info-card" style={{ borderLeft: '4px solid var(--orange)' }}>
                <h4 style={{ color: 'var(--orange-dark)', marginBottom: 12 }}>Certifications</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {instructor.certifications.map((cert, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: 'var(--chalk-dim)', borderRadius: 4, fontSize: '0.9rem', color: 'var(--charcoal)', borderLeft: '3px solid var(--orange)' }}>
                      {cert}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {instructor.coachingExperience && (
              <div className="info-card" style={{ borderLeft: '4px solid var(--orange)' }}>
                <h4 style={{ color: 'var(--orange-dark)', marginBottom: 8 }}>Coaching Experience</h4>
                <p style={{ whiteSpace: 'pre-wrap' }}>{instructor.coachingExperience}</p>
              </div>
            )}
            {instructor.experience && (
              <div className="info-card" style={{ borderLeft: '4px solid var(--orange)' }}>
                <h4 style={{ color: 'var(--orange-dark)', marginBottom: 8 }}>Climbing Experience</h4>
                <p style={{ whiteSpace: 'pre-wrap' }}>{instructor.experience}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
