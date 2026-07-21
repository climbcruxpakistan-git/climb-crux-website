import mongoose from 'mongoose'

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  bio: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  experience: { type: String, default: '' },
  coachingExperience: { type: String, default: '' },
  certifications: [String],
  specialties: { type: String, default: '' },
  instagram: { type: String, default: '' },
  facebook: { type: String, default: '' },
  climbingProfile: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('TeamMember', teamMemberSchema)
