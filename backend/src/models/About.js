import mongoose from 'mongoose'

const safetyItemSchema = new mongoose.Schema({
  h: { type: String, required: true },
  p: { type: String, required: true },
}, { _id: false })

const aboutSchema = new mongoose.Schema({
  description: {
    type: String,
    default: `Climb Crux is a rock climbing club based in Islamabad, dedicated to making rock climbing safe, accessible and enjoyable for people of all ages and experience levels. We offer professionally guided climbing sessions, structured coaching, monthly memberships and a welcoming community where every climber can learn, train and grow.

Whether you're trying rock climbing for the first time or looking to improve your skills. Our experienced instructors provide a safe and supportive environment focused on confidence, technique and internationally recognized safety practices. From beginners to experienced climbers, everyone is welcome.

More than just climbing sessions, Climb Crux is building a passionate climbing community in Pakistan through public sessions, private coaching, memberships, workshops and outdoor adventures. Whether you're looking for a new challenge, a unique fitness activity or a rock climbing club in Islamabad. We're here to help you reach new heights.`,
  },
  safetyItems: [safetyItemSchema],
}, { timestamps: true })

export default mongoose.model('About', aboutSchema)
