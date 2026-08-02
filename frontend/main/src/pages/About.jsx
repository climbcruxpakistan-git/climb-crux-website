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
    `Climb Crux is a rock climbing club based in Islamabad, dedicated to making rock climbing safe, accessible and enjoyable for people of all ages and experience levels. We offer professionally guided climbing sessions, structured coaching, monthly memberships and a welcoming community where every climber can learn, train and grow.

Whether you're trying rock climbing for the first time or looking to improve your skills. Our experienced instructors provide a safe and supportive environment focused on confidence, technique and internationally recognized safety practices. From beginners to experienced climbers, everyone is welcome.

More than just climbing sessions, Climb Crux is building a passionate climbing community in Pakistan through public sessions, private coaching, memberships, workshops and outdoor adventures. Whether you're looking for a new challenge, a unique fitness activity or a rock climbing club in Islamabad. We're here to help you reach new heights.`
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
