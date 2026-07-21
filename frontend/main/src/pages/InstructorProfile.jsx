import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTeam } from '../api.js'
import PlaceholderPhoto from '../components/PlaceholderPhoto.jsx'
import CliffEdge from '../components/CliffEdge.jsx'

export default function InstructorProfile() {
  const { id } = useParams()
  const [instructor, setInstructor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch all team members and find the one with matching ID
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
        <Link to="/our-team" className="btn btn-outline" style={{ marginTop: 16 }}>← Back to team</Link>
      </section>
    )
  }

  return (
    <>
      {/* Profile Hero */}
      <section className="instructor-profile-hero">
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 48, alignItems: 'start', paddingTop: 48, paddingBottom: 64 }}>
          {/* Photo */}
          <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
            {instructor.photoUrl ? (
              <img src={instructor.photoUrl} alt={instructor.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
            ) : (
              <PlaceholderPhoto tag="Instructor photo" ratio="1 / 1" />
            )}
          </div>

          {/* Info */}
          <div>
            <Link to="/our-team" className="btn btn-outline-light" style={{ marginBottom: 24, display: 'inline-flex' }}>← Back to team</Link>
            <h1 style={{ color: 'var(--chalk)', fontSize: 'clamp(2rem, 4vw, 3rem)', marginTop: 12, marginBottom: 4 }}>{instructor.name}</h1>
            <p style={{ color: 'var(--orange-light)', fontSize: '1.1rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 20 }}>{instructor.role}</p>
            <p style={{ color: '#c9c4b8', fontSize: '1.02rem', maxWidth: '56ch', lineHeight: 1.7 }}>{instructor.bio}</p>

            {/* Social Links — Instagram + Climbing Profile */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {instructor.instagram && (
                <a href={instructor.instagram} target="_blank" rel="noreferrer" className="btn btn-outline-light" style={{ fontSize: '0.78rem', padding: '0.6em 1.2em' }}>
                  Instagram
                </a>
              )}
              {instructor.climbingProfile && (
                <a href={instructor.climbingProfile} target="_blank" rel="noreferrer" className="btn btn-outline-light" style={{ fontSize: '0.78rem', padding: '0.6em 1.2em' }}>
                  View climbing profile
                </a>
              )}
            </div>
          </div>
        </div>
        <CliffEdge fill="var(--chalk)" height={40} />
      </section>

      {/* Detailed Info — horizontal row */}
      <section className="section">
        <div className="wrap">
          <div className="instructor-details" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
            {/* Certifications — each on its own row */}
            {instructor.certifications && instructor.certifications.length > 0 && (
              <div className="info-card" style={{ borderLeft: '4px solid var(--orange)' }}>
                <h4 style={{ color: 'var(--orange-dark)', marginBottom: 12 }}>Certifications</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {instructor.certifications.map((cert, i) => (
                    <div key={i} style={{
                      padding: '8px 12px',
                      background: 'var(--chalk-dim)',
                      borderRadius: 4,
                      fontSize: '0.9rem',
                      color: 'var(--charcoal)',
                      borderLeft: '3px solid var(--orange)',
                    }}>
                      {cert}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coaching Experience */}
            {instructor.coachingExperience && (
              <div className="info-card" style={{ borderLeft: '4px solid var(--orange)' }}>
                <h4 style={{ color: 'var(--orange-dark)', marginBottom: 8 }}>Coaching Experience</h4>
                <p style={{ whiteSpace: 'pre-wrap' }}>{instructor.coachingExperience}</p>
              </div>
            )}

            {/* Climbing Experience */}
            {instructor.experience && (
              <div className="info-card" style={{ borderLeft: '4px solid var(--orange)' }}>
                <h4 style={{ color: 'var(--orange-dark)', marginBottom: 8 }}>Climbing Experience</h4>
                <p style={{ whiteSpace: 'pre-wrap' }}>{instructor.experience}</p>
              </div>
            )}

          </div>
        </div>
      </section>

      <style>{`
        .instructor-profile-hero {
          background: linear-gradient(135deg, var(--charcoal-deep), var(--charcoal));
          color: var(--chalk);
          position: relative;
        }
        .instructor-details .info-card:hover h4 {
          color: var(--charcoal) !important;
        }
        @media (max-width: 760px) {
          .instructor-profile-hero .wrap {
            grid-template-columns: 1fr !important;
            gap: 24px;
          }
        }
      `}</style>
    </>
  )
}
