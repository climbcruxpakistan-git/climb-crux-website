import { Router } from 'express'
import SessionContent from '../models/SessionContent.js'

const router = Router()

// GET /api/session-content — returns the single session-content document
router.get('/', async (_req, res, next) => {
  try {
    let content = await SessionContent.findOne()
    if (!content) {
      content = await SessionContent.create({
        includedItems: [
          { h: 'Certified guidance', p: 'Every session is led by a certified climbing instructor, start to finish.' },
          { h: 'Full safety gear', p: 'Harness, helmet, rope, belay setup, and climbing shoes provided.' },
          { h: 'Beginner-friendly routes', p: 'Routes are set for first-timers, roughly grade 4–6a on the French scale.' },
          { h: 'Small groups', p: 'Group sessions capped at 20 climbers so there\'s plenty of room on the wall.' },
        ],
        faqs: [
          { q: 'Do I need climbing experience?', a: 'No — public sessions are built for first-timers. Instructors walk you through technique, belay basics, and route reading before anyone leaves the ground.' },
          { q: 'What should I bring?', a: 'Comfortable athletic clothing, closed-toe shoes you can climb in, water, and sun protection. We provide the harness, helmet, rope, and climbing shoes.' },
          { q: 'What is the minimum age?', a: 'Climbers 10 and up are welcome on public sessions. Anyone under 18 needs a parent or guardian\'s consent.' },
          { q: 'What if it rains or a session is cancelled?', a: 'We reschedule affected sessions to the next available date, or move your booking to a private session at no extra cost.' },
        ],
        pricingTitle: 'Public Session',
        pricingPrice: '4,500',
        pricingUnit: '/ person',
        pricingFeatures: [
          { text: '2–3 hour guided session' },
          { text: 'Certified instructor & safety briefing' },
          { text: 'Harness, helmet, rope, belay gear & climbing shoes' },
          { text: 'Group of up to 20 climbers' },
        ],
      })
    }
    res.json(content)
  } catch (err) { next(err) }
})

// PUT /api/session-content — updates the single document
router.put('/', async (req, res, next) => {
  try {
    let content = await SessionContent.findOne()
    if (!content) {
      content = new SessionContent()
    }
    if (req.body.includedItems !== undefined) content.includedItems = req.body.includedItems
    if (req.body.faqs !== undefined) content.faqs = req.body.faqs
    if (req.body.sessionsDisabled !== undefined) content.sessionsDisabled = req.body.sessionsDisabled
    if (req.body.pricingTitle !== undefined) content.pricingTitle = req.body.pricingTitle
    if (req.body.pricingPrice !== undefined) content.pricingPrice = req.body.pricingPrice
    if (req.body.pricingUnit !== undefined) content.pricingUnit = req.body.pricingUnit
    if (req.body.pricingFeatures !== undefined) content.pricingFeatures = req.body.pricingFeatures
    await content.save()
    res.json(content)
  } catch (err) { next(err) }
})

export default router
