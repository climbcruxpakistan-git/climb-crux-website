import 'dotenv/config'
import dns from 'dns'
import mongoose from 'mongoose'
import Session from './models/Session.js'
import Plan from './models/Plan.js'
import TeamMember from './models/TeamMember.js'
import GalleryItem from './models/GalleryItem.js'
import Booking from './models/Booking.js'
import About from './models/About.js'
import SessionContent from './models/SessionContent.js'

// Use custom DNS servers if configured (helps when system DNS blocks mongodb.net)
const dnsServers = process.env.DNS_SERVERS
  ? process.env.DNS_SERVERS.split(',').map((s) => s.trim())
  : null
if (dnsServers) dns.setServers(dnsServers)

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/climb-crux'

const seedSessions = [
  { date: 'Sun, Aug 2', time: '8:00 AM – 1:00 PM', spots: '5 spots left' },
  { date: 'Sun, Aug 16', time: '8:00 AM – 1:00 PM', spots: '7 spots left' },
  { date: 'Sun, Aug 30', time: '8:00 AM – 1:00 PM', spots: 'Open' },
]

const seedPlans = [
  {
    type: 'private-starter', grade: 'Up to 5c', label: 'Small Group', title: 'Starter Private',
    price: '8,000', unit: '/ person', tag: '', featured: false,
    features: ['Private group of up to 4 climbers', 'Choose your own date & time', 'Instructor focused on your group only', 'Full gear provided'],
  },
  {
    type: 'private-advanced', grade: 'Up to 6b+', label: '1-on-1 or Small Group', title: 'Advanced Private',
    price: '15,000', unit: '/ person', tag: 'Most booked', featured: true,
    features: ['1-on-1 or private group of up to 3', 'Technique & movement coaching', 'Progression plan across sessions', 'Priority scheduling'],
  },
  {
    type: 'elite-premium', grade: '7c+', label: 'Highest Grade Access', title: 'Elite Premium',
    price: '30,000', unit: '/ person', tag: '', featured: false,
    features: ['1-on-1 with a senior instructor', 'Access to our hardest routes', 'Fully custom route & pacing plan', 'Performance feedback after each climb'],
  },
]

const seedTeam = [
  {
    name: 'Ahmed Khan',
    role: 'Founder & Head Guide',
    bio: 'Runs every public session and designs our premium routes. Certified in rock rescue and high-angle safety with over 12 years of climbing experience.',
    experience: '12+ years of climbing across Pakistan, Nepal, and Turkey. Has led over 200 group sessions on Margalla Hills and designed the grade 7c+ premium route system. Started climbing at age 16 and has since summited over 30 major routes in the Karakoram range.',
    certifications: [
      'UIAA Certified Climbing Instructor',
      'Wilderness First Responder (WFR)',
      'Rock Rescue Level 3',
      'High-Angle Rescue Technician',
      'Leave No Trace Master Educator',
    ],
    specialties: 'Premium route design, advanced lead climbing technique, multi-pitch safety systems, fear management coaching for advanced climbers.',
    instagram: 'https://instagram.com/climbcrux',
    facebook: 'https://facebook.com/climbcrux',
  },
  {
    name: 'Zara Malik',
    role: 'Private & Premium Coaching',
    bio: 'Focuses on 1-on-1 technique and grade progression for climbers working toward harder routes. Specialist in movement coaching.',
    experience: '8+ years of climbing experience with a focus on technique coaching. Has helped over 50 climbers progress from beginner to advanced grades. Trained under IFMGA-certified guides in the French Alps and regularly updates her coaching methodology.',
    certifications: [
      'PMCIA Certified Climbing Coach',
      'Sports Climbing Level 2 Coach',
      'Certified Belay Systems Trainer',
      'Mental Game Coach Certification',
      'Advanced First Aid',
    ],
    specialties: 'Movement efficiency coaching, grade progression planning, fear of heights management, technique refinement for intermediate climbers.',
    instagram: 'https://instagram.com/climbcrux',
    facebook: 'https://facebook.com/climbcrux',
  },
  {
    name: 'Usman Ali',
    role: 'Public Sessions Lead',
    bio: 'First point of contact for new climbers — patient, safety-first, and great at calming first-timer nerves and making climbing accessible.',
    experience: '6+ years of guiding experience, specializing in beginner and intermediate instruction. Has introduced over 500 first-time climbers to the sport. Known for his patient teaching style and ability to make anyone feel confident on the wall.',
    certifications: [
      'Certified Climbing Instructor',
      'Belay Systems Specialist',
      'Wilderness First Aid',
      'Child Safeguarding Certification',
      'Adaptive Climbing Techniques Training',
    ],
    specialties: 'First-time climber instruction, group dynamics management, adaptive climbing techniques, youth climbing programs, safety briefing expertise.',
    instagram: 'https://instagram.com/climbcrux',
    facebook: 'https://facebook.com/climbcrux',
  },
]

const seedGallery = [
  { tag: 'Public Session · Belay Practice', cat: 'Public Sessions' },
  { tag: 'Public Session · First Ascent', cat: 'Public Sessions' },
  { tag: 'Private Coaching · Technique', cat: 'Private Sessions' },
  { tag: 'Premium Ascent · 7c+', cat: 'High Grade Rock Climbing' },
  { tag: 'Public Session · Group Photo', cat: 'Public Sessions' },
  { tag: 'Private Coaching · 1-on-1', cat: 'Private Sessions' },
  { tag: 'Premium Ascent · Overhang', cat: 'High Grade Rock Climbing' },
  { tag: 'Public Session · Basecamp', cat: 'Public Sessions' },
  { tag: 'Private Coaching · Small Group', cat: 'Private Sessions' },
]

const seedAbout = {
  description: 'Climb Crux is a rock climbing club based in Islamabad, dedicated to making rock climbing safe, accessible and enjoyable for people of all ages and experience levels. We offer professionally guided climbing sessions, structured coaching, monthly memberships and a welcoming community where every climber can learn, train and grow.\n\nClimb Crux was founded with a simple belief: everyone deserves the opportunity to experience the challenge, adventure, and sense of achievement that rock climbing offers. Founded by Pakistan\'s National Lead & Bouldering Climbing Champion, Saif Ud Din, Climb Crux was created to make climbing more accessible, safer and more welcoming for people of all ages and experience levels.\n\nWhat began as a passion for climbing has grown into a community where beginners can take their very first foothold, experienced climbers can continue to progress and everyone is encouraged to challenge themselves in a supportive environment. Every session is built around professional instruction, internationally recognized safety practices and a genuine passion for helping others discover the sport.\n\nToday, Climb Crux is more than a rock climbing club. It\'s a growing community bringing climbers together, inspiring adventure, and helping shape the future of climbing in Pakistan, one climb at a time.',
  safetyItems: [
    { h: 'Pre-climb briefing', p: 'Every session opens with a full gear check and safety walkthrough before anyone touches rock.' },
    { h: 'Certified belay technique', p: 'All instructors are trained and certified in belay systems, knots, and anchor building.' },
    { h: 'Redundant anchor systems', p: 'Routes are set with backup anchor points as standard practice, not an upgrade.' },
    { h: 'First-aid ready', p: 'Instructors carry first-aid kits and are trained in on-site response and evacuation procedure.' },
  ],
}

const seedSessionContent = {
  includedItems: [
    { h: 'Certified guidance', p: 'Every session is led by a certified climbing instructor, start to finish.' },
    { h: 'Full safety gear', p: 'Harness, helmet, rope, belay setup, and climbing shoes provided.' },
    { h: 'Beginner-friendly routes', p: 'Routes are set for first-timers, roughly grade 4–6a on the French scale.' },
    { h: 'Small groups', p: 'Group sessions capped at 20 climbers so there\'s plenty of room on the wall.' },
  ],
  faqs: [
    { q: 'Do I need climbing experience?', a: 'No — public sessions are built for first-timers. Instructors walk you through technique, belay basics, and route reading before anyone leaves the ground.' },
    { q: 'What should I bring?', a: 'Comfortable athletic clothing, closed-toe shoes you can climb in, water, and sun protection. We provide the harness, helmet, rope, and climbing shoes.' },
    { q: 'What is the minimum age?', a: 'Climbers 10 and up are welcome on public sessions. Anyone under 18 needs a parent or guardian\'s consent.' },
    { q: 'What if it rains or a session is cancelled?', a: 'We reschedule affected sessions to the next available date, or move your booking to a private session at no extra cost.' },
    { q: 'Can I pause my membership?', a: 'Yes. Your membership gives you 4 climbing sessions each month, and you can spread them across any of our public session dates that suit you — there\'s no need to book them all at once. If life gets in the way and you need a break, just message us at least 48 hours before your first session and we\'ll pause your membership, carrying any unused sessions over to the next month at no extra cost.' },
  ],
  pricingTitle: 'Public Session',
  pricingPrice: '2,500',
  pricingUnit: '/ person',
  pricingDescription: 'Join a guided group session on Margalla Hills — every other Sunday. Full gear and certified instructors included.',
  pricingFeatures: [
    { text: '2–3 hour guided session' },
    { text: 'Certified instructor & safety briefing' },
    { text: 'Harness, helmet, rope, belay gear & climbing shoes' },
    { text: 'Group of up to 20 climbers' },
  ],
  ppHeaderDesc: 'Private sessions are built around you. Your Choice, just solo, with your group or working toward the highest grades we run.',
}

async function seed() {
  // Safety check: require --force flag or confirm
  if (!process.argv.includes('--force')) {
    console.log('\n⚠️  This will DELETE all existing data and re-seed with defaults.')
    console.log('   Run with --force to proceed: npm run seed -- --force\n')
    process.exit(0)
  }

  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB\n')

  await Promise.all([
    Session.deleteMany({}),
    Plan.deleteMany({}),
    TeamMember.deleteMany({}),
    GalleryItem.deleteMany({}),
    Booking.deleteMany({}),
    About.deleteMany({}),
    SessionContent.deleteMany({}),
  ])
  console.log('Cleared existing data\n')

  const sessions = await Session.insertMany(seedSessions)
  console.log(`Seeded ${sessions.length} sessions`)
  const plans = await Plan.insertMany(seedPlans)
  console.log(`Seeded ${plans.length} plans`)
  const team = await TeamMember.insertMany(seedTeam)
  console.log(`Seeded ${team.length} team members`)
  const gallery = await GalleryItem.insertMany(seedGallery)
  console.log(`Seeded ${gallery.length} gallery items`)
  await About.create(seedAbout)
  console.log('Seeded about page content')
  await SessionContent.create(seedSessionContent)
  console.log('Seeded session & private/premium page content')

  console.log('\n✅ Seed complete!')
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
