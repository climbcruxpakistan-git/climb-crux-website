import { useState, useEffect } from 'react'
import { getAbout } from '../../lib/api'

const DEFAULT_DESCRIPTION = `Climb Crux is a rock climbing club based in Islamabad, dedicated to making rock climbing safe, accessible and enjoyable for people of all ages and experience levels. We offer professionally guided climbing sessions, structured coaching, monthly memberships and a welcoming community where every climber can learn, train and grow.

Climb Crux was founded with a simple belief: everyone deserves the opportunity to experience the challenge, adventure, and sense of achievement that rock climbing offers. Founded by Pakistan's National Lead & Bouldering Climbing Champion, Saif Ud Din, Climb Crux was created to make climbing more accessible, safer and more welcoming for people of all ages and experience levels.

What began as a passion for climbing has grown into a community where beginners can take their very first foothold, experienced climbers can continue to progress and everyone is encouraged to challenge themselves in a supportive environment. Every session is built around professional instruction, internationally recognized safety practices and a genuine passion for helping others discover the sport.

Today, Climb Crux is more than a rock climbing club. It's a growing community bringing climbers together, inspiring adventure, and helping shape the future of climbing in Pakistan, one climb at a time.`

const STATS = [
  { value: '12+', label: 'Years of guiding experience' },
  { value: '500+', label: 'First-time climbers introduced' },
  { value: '200+', label: 'Group sessions led on Margalla Hills' },
  { value: '4 – 7c+', label: 'Grade range — first top-rope to elite' },
]

export default function AboutContent({ initial }) {
  const [data, setData] = useState(initial || { about: null })

  useEffect(() => {
    let active = true
    getAbout()
      .catch(() => null)
      .then((about) => {
        if (active) setData({ about })
      })
    return () => { active = false }
  }, [])

  const about = data.about || {}
  const description = about.description || DEFAULT_DESCRIPTION
  const paragraphs = description
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  const headerLead = paragraphs[0] || ''
  const storyParagraphs = paragraphs.slice(1)

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
            <div className="story-copy">
              <h2>Our Story</h2>
              {storyParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <blockquote className="story-quote">"From beginners to experienced climbers, everyone is welcome."</blockquote>
            </div>
          </div>
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
      </section>
    </>
  )
}
