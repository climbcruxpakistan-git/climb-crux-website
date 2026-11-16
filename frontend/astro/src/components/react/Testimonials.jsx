/**
 * Three fixed climber testimonials in the same dark quote-card look as the
 * review slider (Reviews.css), laid out side by side. Static on purpose: these
 * quotes are always shown, they don't come from the reviews API and carry no
 * date or slider controls.
 *
 * Placed on the home page (between "Pick your adventure" and "Workshops"), the
 * public sessions page (under the pricing cards) and the private & premium
 * page (under the plans).
 */

const TESTIMONIALS = [
  {
    quote: 'It is nice to see the greenery in the Margalla Hills. Having multiple training sessions with Team Climb Crux was a wonderful experience.',
    name: 'Tom',
    country: 'USA',
  },
  {
    quote: 'Shahdara Valley is a beautiful but busy place. Overall, it was a good experience.',
    name: 'Julia',
    country: 'Germany',
  },
  {
    quote: "I didn't expect rock climbing in Islamabad to be this amazing!",
    name: 'Marina',
    country: 'UK',
  },
]

export default function Testimonials() {
  return (
    <section className="tst" aria-label="Climber reviews">
      <div className="wrap tst-grid">
        {TESTIMONIALS.map((t) => (
          <article className="tst-card" key={t.name}>
            <p className="tst-text">
              <span className="tst-qm" aria-hidden="true">“</span>
              {t.quote}
              <span className="tst-qm" aria-hidden="true">”</span>
            </p>
            <div className="tst-footer">
              <p className="tst-name">
                {t.name} <span>({t.country})</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
