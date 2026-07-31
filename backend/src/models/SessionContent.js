import mongoose from 'mongoose'

const includedItemSchema = new mongoose.Schema({
  h: { type: String, required: true },
  p: { type: String, required: true },
}, { _id: false })

const faqSchema = new mongoose.Schema({
  q: { type: String, required: true },
  a: { type: String, required: true },
}, { _id: false })

const pricingFeatureSchema = new mongoose.Schema({
  text: { type: String, required: true },
}, { _id: false })

const customSessionSchema = new mongoose.Schema({
  title: { type: String, default: 'Customizable Session' },
  grade: { type: String, default: 'You decide' },
  label: { type: String, default: 'Fully Custom' },
  price: { type: String, default: 'On Request' },
  unit: { type: String, default: 'Per Person' },
  features: [{ type: String }],
}, { _id: false })

const membershipSchema = new mongoose.Schema({
  title: { type: String, default: 'Monthly Membership' },
  badge: { type: String, default: '🔥 Save 20%' },
  price: { type: String, default: '8,000' },
  originalPrice: { type: String, default: '10,000' },
  discount: { type: String, default: '20%' },
  unit: { type: String, default: '/ Month' },
  category: { type: String, default: 'Membership' },
  duration: { type: String, default: '1 Month' },
  sessionsIncluded: { type: String, default: '4' },
  description: { type: String, default: 'Train consistently with our monthly climbing membership. Enjoy four climbing sessions every month at a discounted price while improving your strength, technique, and confidence.' },
  features: [{ type: String }],
  ctaLabel: { type: String, default: 'Get Monthly Membership' },
}, { _id: false })

const ppCustomItemSchema = new mongoose.Schema({
  h: { type: String, default: '' },
  p: { type: String, default: '' },
}, { _id: false })

const sessionContentSchema = new mongoose.Schema({
  includedItems: [includedItemSchema],
  faqs: [faqSchema],
  sessionsDisabled: { type: Boolean, default: false },
  pricingTitle: { type: String, default: 'Public Session' },
  pricingPrice: { type: String, default: '2,500' },
  pricingUnit: { type: String, default: '/ person' },
  pricingDescription: { type: String, default: 'Join a guided group session on Margalla Hills — every other Sunday. Full gear and certified instructors included.' },
  pricingFeatures: [pricingFeatureSchema],

  // Sessions page content
  sessionsHeaderTitle: { type: String, default: 'Climb with the group.' },
  sessionsHeaderDesc: { type: String, default: 'Every other Sunday, we set beginner-friendly routes on the limestone of Margalla Hills and open the wall to the public. No gear, no experience, no problem.' },
  sessionsSectionTitle: { type: String, default: 'Upcoming sessions' },
  pricingSectionTitle: { type: String, default: 'One flat rate, everything included' },
  includedSectionTitle: { type: String, default: 'Everything you need, nothing to bring' },
  faqEyebrow: { type: String, default: 'Good to know' },
  faqSectionTitle: { type: String, default: 'Frequently asked questions' },
  membership: { type: membershipSchema, default: () => ({}) },

  // Private & Premium page content
  ppHeaderTitle: { type: String, default: 'Your route, your pace.' },
  ppHeaderDesc: { type: String, default: 'Private sessions are built around you — solo, with your group, or working toward the highest grades we run.' },
  ppEyebrow: { type: String, default: 'Plans' },
  ppSectionTitle: { type: String, default: 'Pick a plan to start from' },
  ppSectionDesc: { type: String, default: 'Every plan below is a starting point, not a fixed package — Tell us the goal and we\'ll design the climb around it.' },
  ppCustomSession: { type: customSessionSchema, default: () => ({}) },
  ppCustomEyebrow: { type: String, default: 'What gets customized' },
  ppCustomSectionTitle: { type: String, default: 'Built around your goal, not a template' },
  ppCustomItems: [ppCustomItemSchema],
}, { timestamps: true })

export default mongoose.model('SessionContent', sessionContentSchema)
