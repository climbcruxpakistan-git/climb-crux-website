import { Router } from 'express'
import Session from '../models/Session.js'

const router = Router()

// GET /api/sessions
router.get('/', async (_req, res, next) => {
  try {
    const sessions = await Session.find().sort({ date: 1 })
    res.json(sessions)
  } catch (err) { next(err) }
})

// POST /api/sessions
router.post('/', async (req, res, next) => {
  try {
    const { date, time, spots } = req.body
    if (!date || !time) return res.status(400).json({ error: 'Date and time are required' })
    const session = await Session.create({ date, time, spots })
    res.status(201).json(session)
  } catch (err) { next(err) }
})

// PUT /api/sessions/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { date, time, spots } = req.body
    if (!date || !time) return res.status(400).json({ error: 'Date and time are required' })
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { date, time, spots },
      { new: true, runValidators: true }
    )
    if (!session) return res.status(404).json({ error: 'Not found' })
    res.json(session)
  } catch (err) { next(err) }
})

// DELETE /api/sessions/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id)
    if (!session) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
