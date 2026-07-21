import { Router } from 'express'
import TeamMember from '../models/TeamMember.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const members = await TeamMember.find().sort({ createdAt: 1 })
    res.json(members)
  } catch (err) { next(err) }
})

// GET /api/team/:id — single team member with full details
router.get('/:id', async (req, res, next) => {
  try {
    const member = await TeamMember.findById(req.params.id)
    if (!member) return res.status(404).json({ error: 'Not found' })
    res.json(member)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })
    const member = await TeamMember.create({
      name,
      role: req.body.role || '',
      tag: req.body.tag || '',
      bio: req.body.bio || '',
      photoUrl: req.body.photoUrl || '',
      experience: req.body.experience || '',
      coachingExperience: req.body.coachingExperience || '',
      certifications: Array.isArray(req.body.certifications) ? req.body.certifications.filter(Boolean) : [],
      specialties: req.body.specialties || '',
      instagram: req.body.instagram || '',
      facebook: req.body.facebook || '',
      climbingProfile: req.body.climbingProfile || '',
    })
    res.status(201).json(member)
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { name, role, tag, bio, photoUrl, experience, coachingExperience, certifications, specialties, instagram, facebook, climbingProfile } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })
    // Ensure certifications is an array
    const certs = Array.isArray(certifications) ? certifications.filter(Boolean) : []
    const member = await TeamMember.findByIdAndUpdate(
      req.params.id,
      { name, role, tag, bio, photoUrl, experience, coachingExperience, certifications: certs, specialties, instagram, facebook, climbingProfile },
      { new: true, runValidators: true }
    )
    if (!member) return res.status(404).json({ error: 'Not found' })
    res.json(member)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const member = await TeamMember.findByIdAndDelete(req.params.id)
    if (!member) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
