# Climb Crux — website

A 5-page React + Vite site for Climb Crux, built around the brand's
charcoal / orange mark and the limestone of Margalla Hills.

## Run it locally

You'll need [Node.js](https://nodejs.org) 18+ installed.

```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`).

To build the production version:

```bash
npm run build
```

This outputs a static `dist/` folder you can upload to any host
(Netlify, Vercel, Hostinger, cPanel, etc).

## Pages

| Route              | File                             | Purpose                                   |
| ------------------ | --------------------------------- | ------------------------------------------ |
| `/`                 | `src/pages/Home.jsx`              | Hero, path split, trust strip, gallery teaser |
| `/sessions`         | `src/pages/Sessions.jsx`          | Public session details, schedule, pricing, booking form, FAQ |
| `/private-premium`  | `src/pages/PrivatePremium.jsx`    | Private & premium tiers, customization, CTA |
| `/our-team`          | `src/pages/OurTeam.jsx`            | Instructor profiles, mission, safety approach |
| `/gallery`          | `src/pages/Gallery.jsx`           | Filterable photo grid |

Shared UI lives in `src/components/` (`Navbar`, `Footer`, `Layout`,
`PageHeader`, `GradeBadge`, `CliffEdge`, `PlaceholderPhoto`).

## Things to swap before launch

1. **Photos** — every gray-and-orange panel is a `<PlaceholderPhoto />`.
   Replace its usage with a plain `<img src="/your-photo.jpg" alt="..." />`
   wherever you have real photography. Put image files in `public/`.
2. **Pricing** — all prices (PKR 4,500 / 8,000 / 15,000 / 30,000) are
   placeholders. Update them in `Sessions.jsx` and `PrivatePremium.jsx`.
3. **Contact details** — phone, email, and social links are placeholders
   in `Footer.jsx`.
4. **Instructor bios** — generic names/roles in `OurTeam.jsx`, ready for
   real names, photos, and certifications.
5. **Booking form** — the form in `Sessions.jsx` is front-end only right
   now; it shows a success message but doesn't send anywhere yet. Wire it
   to an email service (e.g. Formspree, EmailJS) or your own backend —
   happy to help with that next.

## Design notes

- Colors are pulled directly from the logo: charcoal `#383839` and
  orange `#f36f21`, paired with a limestone/chalk off-white background
  (`#f6f2e9`) as a nod to the rock itself.
- Typography: Oswald (condensed, industrial) for headings/labels, Work
  Sans for body copy.
- The jagged edge between sections (`CliffEdge` component) echoes the
  cliff silhouette in the logo.
- The orange "grade badge" (e.g. `5.7 · Beginner Friendly`) is the
  recurring signature element, used to show real climbing-route
  difficulty wherever a session or plan is presented.
