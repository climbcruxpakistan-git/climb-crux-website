import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader.jsx'
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
  const description = about?.description || ''

  return (
    <>
      <PageHeader eyebrow="About Climb Crux" title="Built by climbers, for climbers.">
        <p>
          {description ||
            "Climb Crux started with a simple idea: the limestone of Margalla Hills shouldn't be reserved for people who already know how to climb. We run sessions for the person picking up a harness for the first time, and for the one training toward their hardest send yet."}
        </p>
      </PageHeader>

      <section className="section" style={{ background: 'var(--chalk-dim)' }}>
        <div className="wrap">
          <span className="eyebrow">Safety approach</span>
          <h2>Safety isn't an add-on, it's the baseline</h2>
          {loading ? (
            <p style={{ color: 'var(--stone)' }}>Loading…</p>
          ) : (
            <div className="info-grid">
              {safety.map((s) => (
                <div className="info-card" key={s.h}>
                  <h4>{s.h}</h4>
                  <p>{s.p}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
