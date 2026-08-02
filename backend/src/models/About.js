import mongoose from 'mongoose'

const safetyItemSchema = new mongoose.Schema({
  h: { type: String, required: true },
  p: { type: String, required: true },
}, { _id: false })

const aboutSchema = new mongoose.Schema({
  description: {
    type: String,
    default: `Climb Crux is a rock climbing club based in Islamabad, dedicated to making rock climbing safe, accessible and enjoyable for people of all ages and experience levels. We offer professionally guided climbing sessions, structured coaching, monthly memberships and a welcoming community where every climber can learn, train and grow.

Climb Crux was founded with a simple belief: everyone deserves the opportunity to experience the challenge, adventure, and sense of achievement that rock climbing offers. Founded by Pakistan's National Lead & Bouldering Climbing Champion, Saif Ud Din, Climb Crux was created to make climbing more accessible, safer and more welcoming for people of all ages and experience levels.

What began as a passion for climbing has grown into a community where beginners can take their very first foothold, experienced climbers can continue to progress and everyone is encouraged to challenge themselves in a supportive environment. Every session is built around professional instruction, internationally recognized safety practices and a genuine passion for helping others discover the sport.

Today, Climb Crux is more than a rock climbing club. It's a growing community bringing climbers together, inspiring adventure, and helping shape the future of climbing in Pakistan, one climb at a time.`,
  },
  safetyItems: [safetyItemSchema],
}, { timestamps: true })

export default mongoose.model('About', aboutSchema)
