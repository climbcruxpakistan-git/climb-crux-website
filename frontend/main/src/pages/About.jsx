import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import PageHeaderSkeleton from '../components/PageHeaderSkeleton.jsx'
import { getAbout } from '../api.js'

export default function About() {
  const [about, setAbout] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAbout()
      .then(setAbout)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const safety = about?.safetyItems || []
  const description =
    about?.description ||
    `Climb Crux is an outdoor rock climbing community dedicated to making climbing safe, accessible and enjoyable for people of all ages and experience levels in Pakistan. Based in the Islamabad region, we offer professionally guided climbing sessions, beginner-friendly experiences, skill development programs and climbing memberships designed to help every climber progress with confidence.

Whether you're trying outdoor rock climbing for the first time or looking to improve your climbing technique, our experienced instructors provide structured coaching in a safe and supportive environment. Every session emphasizes proper climbing techniques, equipment safety and personal growth while ensuring an enjoyable experience for individuals, families, students and corporate groups.

From public climbing sessions and private coaching to memberships, workshops and special events, Climb Crux is committed to providing high-quality climbing experiences for beginners and experienced climbers alike. Whether you're looking for a fun weekend activity, regular climbing training, or a new fitness challenge, we're here to help you reach new heights.`
  const descriptionParagraphs = description
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <>
      {loading ? (
        <PageHeaderSkeleton />
      ) : (
        <div className="page-fade-in">
          <PageHeader eyebrow="About Climb Crux" title="Built by climbers, for climbers.">
            {descriptionParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </PageHeader>
        </div>
      )}

      <section className="section" style={{ background: 'var(--chalk-dim)' }}>
        <div className="wrap">
          <span className="eyebrow">Safety approach</span>
          <h2>Safety isn't an add-on, it's the baseline</h2>
          {loading ? (
            <p style={{ color: 'var(--stone)' }}>Loading…</p>
          ) : (
            <div className="page-fade-in">
              <div className="info-grid">
                {safety.map((s) => (
                  <div className="info-card" key={s.h}>
                    <h4>{s.h}</h4>
                    <p>{s.p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
