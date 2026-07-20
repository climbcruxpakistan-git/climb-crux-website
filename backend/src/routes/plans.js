import { Router } from 'express'
import Plan from '../models/Plan.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const plans = await Plan.find().sort({ createdAt: 1 })
    res.json(plans)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { title, type, grade, label, price } = req.body
    if (!title || !price) return res.status(400).json({ error: 'Title and price are required' })
    if (!type || !grade || !label) return res.status(400).json({ error: 'Type, grade, and label are required' })
    const plan = await Plan.create({
      title, type, grade, label, price,
      unit: req.body.unit || '/ person',
      tag: req.body.tag || '',
      featured: req.body.featured || false,
      features: (req.body.features || []).filter((f) => f.trim()),
    })
    res.status(201).json(plan)
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { title, type, grade, label, price, unit, tag, featured, features } = req.body
    const update = { title, type, grade, label, price, unit, tag, featured }
    if (features) update.features = features.filter((f) => f.trim())
    const plan = await Plan.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    if (!plan) return res.status(404).json({ error: 'Not found' })
    res.json(plan)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id)
    if (!plan) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
