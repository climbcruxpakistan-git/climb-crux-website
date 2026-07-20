import { Router } from 'express'
import HomeContent from '../models/HomeContent.js'

const router = Router()

// GET /api/home — returns the single home-content document (auto-creates with defaults)
router.get('/', async (_req, res, next) => {
  try {
    let content = await HomeContent.findOne()
    if (!content) {
      content = await HomeContent.create({
        paths: [
          { grade: '4 – 6a', label: 'Beginner Friendly', title: 'Public Sessions', copy: 'Drop into a guided group session on Margalla Hills every other week. No experience or gear needed — just a willingness to get chalky hands.', to: '/sessions', cta: 'See schedule & pricing' },
          { grade: 'Up to 7c+', label: 'Custom & Premium', title: 'Private & Premium', copy: 'Book a private slot for your group or go one-on-one with an instructor. Premium plans open the door to the hardest routes we run.', to: '/private-premium', cta: 'Explore plans' },
        ],
        teasers: [
          { tag: 'Public Session · 4+' },
          { tag: 'Private Coaching · 1-on-1' },
          { tag: 'Premium Ascent · 7c+' },
        ],
      })
    }
    res.json(content)
  } catch (err) { next(err) }
})

// PUT /api/home — updates the single document
router.put('/', async (req, res, next) => {
  try {
    let content = await HomeContent.findOne()
    if (!content) {
      content = new HomeContent()
    }
    const fields = ['heroTitle', 'heroLede', 'heroPhotoUrl', 'pathsEyebrow', 'pathsTitle', 'teasersEyebrow', 'teasersTitle', 'paths', 'teasers', 'teaserSessionSlug']
    for (const field of fields) {
      if (req.body[field] !== undefined) content[field] = req.body[field]
    }
    await content.save()
    res.json(content)
  } catch (err) { next(err) }
})

export default router
