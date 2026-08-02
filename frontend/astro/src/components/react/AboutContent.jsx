import { useState, useEffect } from 'react'
import { getAbout, getUploads } from '../../lib/api'
import CliffEdge from './CliffEdge.jsx'

const DEFAULT_DESCRIPTION = `Climb Crux is a rock climbing club based in Islamabad, dedicated to making rock climbing safe, accessible and enjoyable for people of all ages and experience levels. We offer professionally guided climbing sessions, structured coaching, monthly memberships and a welcoming community where every climber can learn, train and grow.

Whether you're trying rock climbing for the first time or looking to improve your skills. Our experienced instructors provide a safe and supportive environment focused on confidence, technique and internationally recognized safety practices. From beginners to experienced climbers, everyone is welcome.

More than just climbing sessions, Climb Crux is building a passionate climbing community in Pakistan through public sessions, private coaching, memberships, workshops and outdoor adventures. Whether you're looking for a new challenge, a unique fitness activity or a rock climbing club in Islamabad. We're here to help you reach new heights.`

const STATS = [
  { value: '12+', label: 'Years of guiding experience' },
  { value: '500+', label: 'First-time climbers introduced' },
  { value: '200+', label: 'Group sessions led on Margalla Hills' },
  { value: '4 – 7c+', label: 'Grade range — first top-rope to elite' },
]

export default function AboutContent({ initial }) {
  const [data, setData] = useState(initial || { about: null, uploads: [] })

  useEffect(() => {
    let active = true
    Promise.all([getAbout().catch(() => null), getUploads().catch(() => [])])
      .then(([about, uploads]) => {
        if (active) setData({ about, uploads })
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const about = data.about || {}
  const uploads = data.uploads || []
  const safety = about.safetyItems || []
  const description = about.description || DEFAULT_DESCRIPTION
  const paragraphs = description
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  const headerLead = paragraphs[0] || ''
  const storyParagraphs = paragraphs.slice(1)
  const storyPhotoUrl = uploads.find((u) => u.url)?.url || ''

  return (
    <>
      <section className="page-header">
        <div className="page-header-pattern"></div>
        <div className="page-header-accent"></div>
        <div className="wrap page-header-inner">
          <span className="eyebrow">About Climb Crux</span>
          <h1>Built by climbers, for climbers.</h1>
          {headerLead && (
            <div className="page-header-desc">
              <p>{headerLead}</p>
            </div>
          )}
        </div>
      </section>

      {storyParagraphs.length > 0 && (
        <section className="section about-story">
          <div className="wrap story-grid">
            <figure className="story-media">
              <div className="story-badge">
                <span className="grade-badge"><span className="grade">4 – 7c+</span><span className="label">All levels welcome</span></span>
              </div>
              {storyPhotoUrl ? (
                <img src={storyPhotoUrl} alt="Rock climbing session on Margalla Hills, Islamabad" />
              ) : (
                <div className="placeholder-photo" style={{ '--ar': '4 / 3' }}>
                  <span className="tag">Margalla Hills · Climbing Session</span>
                </div>
              )}
              <figcaption>On the limestone crags of Margalla Hills — our home wall.</figcaption>
            </figure>
            <div className="story-copy">
              <span className="eyebrow">Our story</span>
              <h2>From first foothold to 7c+ sends</h2>
              {storyParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <blockquote className="story-quote">"From beginners to experienced climbers, everyone is welcome."</blockquote>
            </div>
          </div>
          <CliffEdge fill="var(--charcoal)" height={40} />
        </section>
      )}

      <section className="stats-band">
        <div className="wrap stats-grid">
          {STATS.map((s) => (
            <div className="stat" key={s.label}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
        <CliffEdge fill="var(--chalk-dim)" height={40} />
      </section>

      <section className="section safety-section">
        <div className="wrap">
          <span className="eyebrow">Safety approach</span>
          <h2>Safety isn't an add-on, it's the baseline</h2>
          <p className="section-intro">Every climb runs on a checklist of certified, redundant safety systems — before anyone touches rock.</p>
          <div className="safety-grid">
            {safety.length > 0 ? (
              safety.map((s, i) => (
                <div className="safety-card" key={s.h}>
                  <span className="safety-num">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{s.h}</h3>
                  <p>{s.p}</p>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--stone)' }}>No safety items yet.</p>
            )}
          </div>
        </div>
        <CliffEdge fill="var(--charcoal)" height={48} />
      </section>
    </>
  )
}
