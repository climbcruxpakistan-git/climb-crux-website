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

const ppCustomItemSchema = new mongoose.Schema({
  h: { type: String, default: '' },
  p: { type: String, default: '' },
}, { _id: false })

const sessionContentSchema = new mongoose.Schema({
  includedItems: [includedItemSchema],
  faqs: [faqSchema],
  sessionsDisabled: { type: Boolean, default: false },
  pricingTitle: { type: String, default: 'Public Session' },
  pricingPrice: { type: String, default: '4,500' },
  pricingUnit: { type: String, default: '/ person' },
  pricingFeatures: [pricingFeatureSchema],

  // Sessions page content
  sessionsHeaderTitle: { type: String, default: 'Climb with the group.' },
  sessionsHeaderDesc: { type: String, default: 'Every other Sunday, we set beginner-friendly routes on the limestone of Margalla Hills and open the wall to the public. No gear, no experience, no problem.' },
  sessionsSectionTitle: { type: String, default: 'Upcoming sessions' },
  pricingSectionTitle: { type: String, default: 'One flat rate, everything included' },
  includedSectionTitle: { type: String, default: 'Everything you need, nothing to bring' },
  faqEyebrow: { type: String, default: 'Good to know' },
  faqSectionTitle: { type: String, default: 'Frequently asked questions' },
  customSession: { type: customSessionSchema, default: () => ({}) },

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
