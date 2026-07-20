import { Router } from 'express'
import About from '../models/About.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    let about = await About.findOne()
    if (!about) {
      about = await About.create({ description: '', safetyItems: [] })
    }
    res.json(about)
  } catch (err) { next(err) }
})

router.put('/', async (req, res, next) => {
  try {
    let about = await About.findOne()
    if (!about) {
      about = await About.create(req.body)
    } else {
      if (req.body.description !== undefined) about.description = req.body.description
      if (req.body.safetyItems !== undefined) about.safetyItems = req.body.safetyItems
      await about.save()
    }
    res.json(about)
  } catch (err) { next(err) }
})

export default router
