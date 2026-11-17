import ReviewSlider from './ReviewSlider.jsx'

/**
 * Three fixed climber testimonials shown in the shared quote slider
 * (ReviewSlider.jsx): the sliding dark cards with peeking neighbours, arrows,
 * dots and swipe. Static on purpose: these quotes are always shown, they don't
 * come from the reviews API and carry no date, so there is no line clamp or
 * More dialog — the full quote is always visible.
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
    <ReviewSlider
      sectionClassName="tst"
      ariaLabel="Climber reviews"
      heading="More than just a climb"
      lede="Real experiences and unforgettable moments from people who've climbed with Climb Crux."
      metaClassName="tst-country"
      items={TESTIMONIALS.map((t) => ({
        id: t.name,
        quote: t.quote,
        name: t.name,
        meta: t.country,
      }))}
    />
  )
}
