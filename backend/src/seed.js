import 'dotenv/config'
import dns from 'dns'
import mongoose from 'mongoose'
import Session from './models/Session.js'
import Plan from './models/Plan.js'
import TeamMember from './models/TeamMember.js'
import GalleryItem from './models/GalleryItem.js'
import Booking from './models/Booking.js'
import About from './models/About.js'

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
  description: 'Climb Crux started with a simple idea: the limestone of Margalla Hills shouldn\'t be reserved for people who already know how to climb. We run sessions for the person picking up a harness for the first time, and for the one training toward their hardest send yet.',
  safetyItems: [
    { h: 'Pre-climb briefing', p: 'Every session opens with a full gear check and safety walkthrough before anyone touches rock.' },
    { h: 'Certified belay technique', p: 'All instructors are trained and certified in belay systems, knots, and anchor building.' },
    { h: 'Redundant anchor systems', p: 'Routes are set with backup anchor points as standard practice, not an upgrade.' },
    { h: 'First-aid ready', p: 'Instructors carry first-aid kits and are trained in on-site response and evacuation procedure.' },
  ],
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

  console.log('\n✅ Seed complete!')
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
