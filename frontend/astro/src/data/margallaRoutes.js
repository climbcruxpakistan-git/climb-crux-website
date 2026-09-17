/**
 * Margalla Hills climbing guide data.
 *
 * Source: "Monkey Business – Margalla Climbing" by John Arran, February 2011.
 * Route names, grades, lengths and descriptions are taken verbatim from that
 * guide. Lengths marked "–" in the source are stored as `null` and omitted on
 * the page (never faked). This is a single source of truth for the guide page
 * and is structured so it can later drive venue pages, route pages, a grade
 * index or a route search.
 *
 * Grade ordering lives in `../lib/grades` and filtering in
 * `../lib/routeFilters` — the data model itself stays: area → venue → route →
 * grade, with climbing area and venue kept as separate fields.
 */

import { compareGrades, sortGrades } from '../lib/grades.js'
import { slugify } from '../lib/slug.js'

export const MARGALLA_SOURCE = {
  title: 'Monkey Business – Margalla Climbing',
  author: 'John Arran',
  published: 'February 2011',
}

export const AREAS = [
  {
    id: 'daman-e-koh',
    name: 'Daman-e-Koh',
    lede: 'The classic Daman-e-Koh hillside above the city, home to several distinct crags from beginner-friendly slabs to Margalla’s hardest lines.',
    venues: [
      {
        id: 'jungle-rock',
        name: 'Jungle Rock',
        gradeRange: '6b+ – 8a',
        character:
          "Margalla's premier crag for harder climbing. Every route is overhanging. Excellent rock, long and continuous routes, sustained and pumpy. Gets shade from early afternoon; stays dry in all but prolonged rain.",
        approach:
          'From the police checkpoint opposite the big Daman-e-Koh car park, follow a trail signed to Cactus Ridge for 2 zig-zags, then head up the fire-clearing. The tall crag appears on the left. ~20 minutes walk.',
        routes: [
          {
            name: "Dog's Dinner",
            grade: '6b+',
            length: 12,
            description:
              'Great 3-D climbing left of stalactites; hard crux above half-height; airy leftward finish.',
          },
          {
            name: 'Girls and Other Animals',
            grade: '7a',
            length: 12,
            description: 'Steep climbing from tree stump up right side of stalactite line.',
          },
          {
            name: 'Wishful Thinking',
            grade: '6c+',
            length: 15,
            description:
              'Technical moves up left side of short overhanging wall left of cave; awkward pull onto ledge; steep finish on big holds and vines.',
          },
          {
            name: 'Moving in Mysterious Ways',
            grade: '7b+',
            length: 15,
            description:
              'Technical start above cave, cool rest, swing left, urgent finish. Low in the grade.',
          },
          {
            name: 'Puzzled Monkey',
            grade: '6c',
            length: 30,
            description: 'Traverse beneath second bolt then sustained to the chain.',
          },
          {
            name: 'Out of Action',
            grade: '8a',
            length: 30,
            description:
              'Completely independent between first bolt and joining Puzzled Monkey at top.',
          },
          {
            name: 'Action Direction',
            grade: '7b+',
            length: 25,
            description:
              "Pocket pulling at 2/3 height may be crux; save strength for top 'rose' move.",
          },
          {
            name: 'Pig Party',
            grade: '6c+',
            length: 25,
            description: "6c if the 3rd bolt crux is avoided on the left.",
          },
        ],
      },
      {
        id: 'jasmin-corner',
        name: 'Jasmin Corner',
        gradeRange: '4b – 5a',
        character:
          'Very accessible, convenient crag for beginners. Short, easy, solid routes. Shade during much of the day except summer.',
        approach:
          'Park in small car park on the right next to a pond. Cross the road and follow good paths into bushes and leftwards to the crag. ~5 minutes walk.',
        routes: [
          { name: 'I', grade: '4b', length: null, description: 'Easy beginner route.' },
          { name: 'II', grade: '4b', length: null, description: 'Easy beginner route.' },
          { name: 'III', grade: '5a', length: null, description: 'Slightly harder beginner route.' },
        ],
      },
      {
        id: 'music-lounge',
        name: 'Music Lounge',
        gradeRange: '5b – 6c',
        character:
          'A small crag in the Jasmin Corner area. Details not explicitly stated in the source, but it sits near Jasmin Corner and Holiday Rock.',
        approach: 'See approach map for Jasmin Corner. ~10 minutes walk.',
        routes: [
          { name: 'Finger Killer', grade: '6c', length: null, description: 'Good footwork and finger strength needed at top.' },
          { name: 'Direttissima', grade: '6b', length: null, description: 'A hard move on the headwall.' },
          { name: 'Fringe Benefits', grade: '6b+', length: null, description: 'With good technique it can feel easy.' },
          { name: 'You Can Do It', grade: '6a+', length: null, description: 'Keep left of the bolts.' },
          { name: 'Benissima', grade: '5b', length: null, description: 'Easier climbing to the right of the bolts.' },
        ],
      },
      {
        id: 'holiday-rock',
        name: 'Holiday Rock',
        gradeRange: '5b',
        character:
          'Excellent for summer shade and gentle climbing. Quiet atmosphere, great view over hills and city. Routes relatively sustained and clean but take care with loose rock. Help prevent bushes from returning, particularly to Eid Mubarak.',
        approach:
          'See approach map for Jasmin Corner. Approach as for Music Lounge but continue 100m further to just before a small clean slab. Take a small path up the hillside, follow it left above the small slab, continue in same direction for another five minutes. Climbs appear on your right. ~20 minutes walk.',
        routes: [
          {
            name: 'Eid Mubarak',
            grade: '5b',
            length: 15,
            description: 'Left hand route: slab, short corner, over a bulge (crux), finish up more slabs.',
          },
          {
            name: 'Merry Christmas',
            grade: '5b',
            length: 15,
            description: 'Right hand route: knobbly wall (crux), then over a roof on big holds.',
          },
        ],
      },
      {
        id: 'said-pur-view',
        name: 'Said Pur View',
        gradeRange: '5c – 8a',
        approach: undefined,
        routes: [
          {
            name: 'The Crack',
            grade: '7c+',
            length: 15,
            description: 'Technical, finger-intensive, very sustained. Direct up the arete is 8a.',
          },
          {
            name: 'Feeling Groovy',
            grade: '8a',
            length: 15,
            description: 'Great moves that may not be possible in summer!',
          },
          {
            name: 'Sidewinder',
            grade: '6c+',
            length: 20,
            description: 'Good but short. Slither right past the proboscis.',
          },
          {
            name: 'Snakes in the Grass',
            grade: '5c',
            length: 20,
            description: 'Be careful of loose rock near top, and standing below.',
          },
          {
            name: 'Slip Sliding Away',
            grade: '6a+',
            length: 25,
            description:
              'Good contrasting climbing. Slab is the crux but solving the roof may be tricky too.',
          },
          {
            name: 'Trekking in the Dark',
            grade: '6a+',
            length: 30,
            description:
              'The best route of its grade in Margalla. Pulling left onto slab under roof is memorable, as is the roof itself.',
          },
        ],
      },
    ],
  },
  {
    id: 'said-pur',
    name: 'Said Pur',
    lede: 'Climbing areas around the village of Said Pur, a short drive up the hillside. Includes some of the longest and most technical routes on this page.',
    venues: [
      {
        id: 'god-rock',
        name: 'God Rock',
        gradeRange: '6b+ – 7b',
        character:
          'Radically overhanging face, gets no sun at all (good for summer). Stays dry in rain. All three routes are fine and generally solid higher up, but first few metres are inherently very loose — great care needed. Once past loose band, Blame God is magnificent.',
        approach:
          'Park in Said Pur village, walk through village, over stream, onto wide path. After crossing back over stream, valley splits; main path follows right fork. Belvedere is on hillside directly in front of split. God Rock and Beetle’s Nest are just beyond, on left and right sides of main path respectively. ~15 minutes walk.',
        notes: [
          'The clean arête left of Blame God will make a fantastic route one day, at a grade of at least 8b.',
        ],
        routes: [
          { name: 'Blame Me', grade: '6c', length: 25, description: 'Fine route, generally solid higher up; loose start.' },
          { name: 'Guilty as Charged', grade: '7b', length: 25, description: 'Starts up Blame Me.' },
          { name: 'Blame God', grade: '6b+', length: 20, description: 'Magnificent once past the loose band.' },
        ],
      },
      {
        id: 'belvedere',
        name: 'Belvedere',
        gradeRange: '5b – 7b+',
        character:
          'Great technical challenges on superb rock; difficulties often short-lived. Sun on face most of the day — great winter venue, only suitable late in day in summer.',
        approach:
          'Pass to the right of the crag on the main path, then head leftwards up the steep hillside, past a short rock ridge, and round left to the base of the climbs.',
        notes: [
          'Descent is usually by abseil. Two ropes are useful to abseil 40m directly from the pitch 2 belay.',
        ],
        routes: [
          { name: 'Hang Loose', grade: '5b', length: null, description: 'Easy route.' },
          { name: 'Saxony Ramp', grade: '5b', length: null, description: 'Bolts since removed.' },
          {
            name: 'Teamwork',
            grade: '6c+',
            length: null,
            type: 'multi-pitch',
            description: 'Multi-pitch route.',
            pitches: [
              {
                label: 'Pitch 1',
                grade: '4a',
                length: null,
                description: 'Very easy slab (bolts removed) to ringbolt, then right past tree to ledge and bolt.',
              },
              {
                label: 'Pitch 2',
                grade: '5c',
                length: null,
                description: 'Follow bolts right and up the crack, stepping down right to belay.',
              },
              {
                label: 'Pitch 3',
                grade: '6b+',
                length: 25,
                description: 'From tree go right to crack, up this then left on jugs to belay.',
              },
              {
                label: 'Pitch 4',
                grade: '6c+',
                length: 30,
                description: 'Pass bulge on its right then follow arête to a hard crux just below top.',
              },
            ],
          },
          {
            name: 'Maverick (3rd pitch variation)',
            grade: '7b+',
            length: 25,
            variation: true,
            description:
              'Top-rope only — not yet bolted. Powerful moves across roof contrast with delicate face climbing above.',
          },
        ],
      },
      {
        id: 'beetles-nest',
        name: "Beetle's Nest",
        gradeRange: '4c – 6b+',
        character:
          'Close to God Rock and Belvedere in the Said Pur area. Details not explicitly stated in the source.',
        approach:
          'Approach as for God Rock — God Rock and Beetle’s Nest sit just beyond the valley split, on the left and right sides of the main path respectively.',
        routes: [
          {
            name: 'Bushman',
            grade: '6b+',
            length: 15,
            description: 'Starts from a ledge a little higher than others. Holds almost imaginary on crux.',
          },
          {
            name: 'Lizard',
            grade: '6b',
            length: 18,
            description: "Looks like a crack but doesn't climb like one.",
          },
          {
            name: 'Get Up, Stand Up',
            grade: '6a+',
            length: 18,
            description: 'Passing first bolt provides a classic technical problem.',
          },
          {
            name: 'For the Girls',
            grade: '6a',
            length: 20,
            description: "Boys can try it too if they're good enough!",
          },
          {
            name: 'Monkey Tower',
            grade: '4c',
            length: 30,
            description: 'A fine introduction to Margalla for new climbers.',
          },
          {
            name: 'Bon Plaisir',
            grade: '5c+',
            length: 30,
            description:
              "Difficulties higher up can be avoided on the right but that would be missing the point.",
          },
        ],
      },
    ],
  },
  {
    id: 'trail-3',
    name: 'Trail 3',
    lede: 'Crags reached from the trailhead of the popular Trail 3 hike, with venues spread across several hillsides above the trail.',
    venues: [
      {
        id: 'legacy-wall',
        name: 'Legacy Wall',
        gradeRange: '6a – 7c+',
        approach:
          'From car park at foot of Trail 3, take left path. Follow until almost level with foot of crag, then find small path on left through bushes. ~15 minutes walk.',
        routes: [
          {
            name: 'Men Holding Hands',
            grade: '7c+',
            length: 18,
            description: 'Hard move into Osama by bolt 3, not yet climbed direct.',
          },
          {
            name: 'Osama bin Climbing',
            grade: '7a+',
            length: 17,
            description:
              'A Margalla classic. Problem start provides crux but layback is most fun.',
          },
          {
            name: 'Reluctant Fundamentalist',
            grade: '7b',
            length: 17,
            description: 'Shares first 2 bolts with Osama but different climbing.',
          },
          {
            name: 'God-Shaped Hole',
            grade: '7a+',
            length: 17,
            description: 'Better and slightly harder to stay left of Legacy ledge.',
          },
          {
            name: 'Legacy',
            grade: '6a+',
            length: 18,
            description: 'Start from boulder at this grade; harder to start direct.',
          },
          {
            name: 'Leg-Up',
            grade: '6b+',
            length: 17,
            description: 'Crux top moves, hard for short climbers.',
          },
          {
            name: 'Leg-Over',
            grade: '6a',
            length: 17,
            description: 'The easiest way up the face.',
          },
          {
            name: 'Progressive Thinking',
            grade: '6b+',
            length: 17,
            description: 'Includes the Legacy direct start.',
          },
          {
            name: 'Kidnapped by Jesus',
            grade: '6c',
            length: 17,
            description:
              'Approximately 50m to the right of Kidnapped by Jesus is a tall wall, approached directly from main trail.',
          },
          {
            name: 'Family Pressures',
            grade: '6c',
            length: 20,
            description: 'Tall wall route.',
          },
        ],
      },
      {
        id: 'hidden-rock',
        name: 'Hidden Rock',
        gradeRange: '6a – 6c',
        character:
          'Good clean rock in a fine location high overlooking the city. Shade arrives shortly after lunch.',
        approach:
          'An abseil approach can be made from sturdy trees above Tarzan, from the bottom of which all routes can be reached.',
        routes: [
          { name: 'Puzzled Fahad', grade: '6c', length: 15, description: 'Harder for the short.' },
          { name: 'Hero of the Day', grade: '6b+', length: 15, description: 'Good clean rock.' },
          { name: "Jane's Cry for More", grade: '6a', length: 15, description: 'Good clean rock.' },
          { name: "Tarzan's Cry of Joy", grade: '6b', length: 15, description: 'Good clean rock.' },
        ],
      },
      {
        id: 'well-hidden-rock',
        name: 'Well Hidden Rock',
        gradeRange: '5a – 8a',
        character:
          'A secluded crag of contrasts with plenty of potential for more new lines. What little sun it gets disappears during the morning.',
        approach:
          'From car park at foot of Trail 3, take right hand path. Follow sign to Trail 5 for 30m and walk up direct fire-clearing until 3rd cross path, just after passing lookout building. Turn right and follow trail for another 20 minutes or so. Look for a left switchback very soon after a right switchback, where there’s an easy way off trail onto a small clearing. Follow small path across hillside, rising slightly. As it curves leftwards, look for another small path on right, leading down through bushes into a muddy gully. From a short way down the gully, either break off right horizontally for 30m to top of Hidden Wall, or continue down and leftwards, scrambling up onto a platform at foot of Well Hidden Wall.',
        routes: [
          { name: 'The Dark Side', grade: '6c', length: 15, description: 'Good climbing throughout. No bridging.' },
          {
            name: 'Cultural Divide',
            grade: '5a',
            length: 15,
            type: 'trad',
            tradGrade: 'VS',
            description:
              'Protectable throughout with good wires. Start in corner and step left at 4m. Crux is wriggling past large jammed block at 12m.',
          },
          {
            name: 'The Optimist',
            grade: '7a+',
            length: 17,
            description:
              'Clip first 2 bolts on The Dark Side, then follow and cross the Divide. Crux moves lead 3m horizontally right from large foothold, then climb back up left almost into Divide before trending right again.',
          },
          {
            name: 'Islamagood',
            grade: '8a',
            length: 17,
            description:
              "One of Margalla's best. Crux is low down but top is still feisty. At half height swing left to share one move with The Optimist before teetering back right and up.",
          },
        ],
      },
    ],
  },
  {
    id: 'shaddarrah',
    name: 'Shaddarrah',
    lede: 'A small roadside crag north-east of Islamabad with only a very few routes.',
    venues: [
      {
        id: 'shaddarrah',
        name: 'Shaddarrah',
        gradeRange: '~5c',
        character:
          'A few kilometres north-east of Islamabad, reached by turning left off Murree Road after passing Lake View Park (site of excellent Ibex climbing wall) and continuing into a gorge in the hills. Small wall adjacent to road on the left.',
        notes: [
          'Unfortunately the few routes (5c or so) may soon no longer exist due to road construction.',
        ],
        routes: [],
      },
    ],
  },
]

/* ── Helpers ─────────────────────────────────────────────────────────── */

/** Display grade — adds the trad tag for graded trad lines, e.g. "VS (5a)". */
export function formatGrade(route) {
  if (route.type === 'trad' && route.tradGrade) {
    return `${route.tradGrade} (${route.grade})`
  }
  return route.grade
}

/** Stable anchor id for a route, e.g. "Dog's Dinner" → "route-dogs-dinner". */
export function routeSlug(name) {
  return `route-${slugify(name)}`
}

/**
 * Flatten every route into a single list, baking in the venue and area it
 * belongs to. Multi-pitch routes appear once (their pitches are included and
 * must be rendered inline, not counted separately).
 */
export function flattenRoutes() {
  const out = []
  for (const area of AREAS) {
    for (const venue of area.venues) {
      for (const route of venue.routes) {
        out.push({
          ...route,
          venueId: venue.id,
          venue: venue.name,
          areaId: area.id,
          area: area.name,
        })
      }
    }
  }
  return out
}export const TOTAL_ROUTES = flattenRoutes().length

/**
 * Every grade a documented route is actually graded at, in climbing order.
 * Derived from the data, never hard-coded, so the guide-page grade range and
 * the route-library grade range always offer exactly the grades that exist.
 * (Multi-pitch routes are graded by their hardest pitch, matching the source
 * guide's route index.)
 */
export const AVAILABLE_GRADES = sortGrades([...new Set(flattenRoutes().map((route) => route.grade))])

/**
 * Coarse grade buckets used by the old `/routes?bucket=…` links. Kept only so
 * those shared/bookmarked URLs keep resolving to a sensible grade range.
 */
export const LEGACY_GRADE_BUCKETS = {
  '4a-4c': ['4a', '4c'],
  '5a-5c': ['5a', '5c+'],
  '6a-6c': ['6a', '6c+'],
  '7a-7c': ['7a', '7c+'],
  '8a+': ['8a', '8a'],
}

/**
 * Sort routes hardest-to-easiest by climbing-grade progression, then by name.
 * Shares the grade ordering with the filters and the guide-page explorer.
 */
export function sortRoutesByGrade(routes) {
  return [...routes].sort(
    (a, b) => compareGrades(a.grade, b.grade) || a.name.localeCompare(b.name)
  )
}
