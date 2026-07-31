import mongoose from 'mongoose'

const safetyItemSchema = new mongoose.Schema({
  h: { type: String, required: true },
  p: { type: String, required: true },
}, { _id: false })

const aboutSchema = new mongoose.Schema({
  description: {
    type: String,
    default: `Climb Crux is an outdoor rock climbing community dedicated to making climbing safe, accessible and enjoyable for people of all ages and experience levels in Pakistan. Based in the Islamabad region, we offer professionally guided climbing sessions, beginner-friendly experiences, skill development programs and climbing memberships designed to help every climber progress with confidence.

Whether you're trying outdoor rock climbing for the first time or looking to improve your climbing technique, our experienced instructors provide structured coaching in a safe and supportive environment. Every session emphasizes proper climbing techniques, equipment safety and personal growth while ensuring an enjoyable experience for individuals, families, students and corporate groups.

From public climbing sessions and private coaching to memberships, workshops and special events, Climb Crux is committed to providing high-quality climbing experiences for beginners and experienced climbers alike. Whether you're looking for a fun weekend activity, regular climbing training, or a new fitness challenge, we're here to help you reach new heights.`,
  },
  safetyItems: [safetyItemSchema],
}, { timestamps: true })

export default mongoose.model('About', aboutSchema)
