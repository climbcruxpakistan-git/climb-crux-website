import mongoose from 'mongoose'

const pathCardSchema = new mongoose.Schema({
  grade: { type: String, default: '4 – 6a' },
  label: { type: String, default: '' },
  title: { type: String, default: '' },
  copy: { type: String, default: '' },
  to: { type: String, default: '' },
  cta: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
}, { _id: false })

const teaserSchema = new mongoose.Schema({
  tag: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
}, { _id: false })

const homeContentSchema = new mongoose.Schema({
  heroTitle: { type: String, default: 'Find your next hold.' },
  heroLede: { type: String, default: 'Guided rock climbing and adventure sessions on the cliffs of Margalla Hills. For the first foothold you ever take, or the hardest grade you\'ve chased yet.' },
  heroPhotoUrl: { type: String, default: '' },
  pathsEyebrow: { type: String, default: 'Two ways to climb with us' },
  pathsTitle: { type: String, default: 'Pick your route' },
  paths: [pathCardSchema],
  teasersEyebrow: { type: String, default: 'From the wall' },
  teasersTitle: { type: String, default: 'A look at recent sessions' },
  teasers: [teaserSchema],
  teaserSessionSlug: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('HomeContent', homeContentSchema)
