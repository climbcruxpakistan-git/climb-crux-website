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
    // Sessions page content
    if (req.body.sessionsHeaderTitle !== undefined) content.sessionsHeaderTitle = req.body.sessionsHeaderTitle
    if (req.body.sessionsHeaderDesc !== undefined) content.sessionsHeaderDesc = req.body.sessionsHeaderDesc
    if (req.body.sessionsSectionTitle !== undefined) content.sessionsSectionTitle = req.body.sessionsSectionTitle
    if (req.body.pricingSectionTitle !== undefined) content.pricingSectionTitle = req.body.pricingSectionTitle
    if (req.body.includedSectionTitle !== undefined) content.includedSectionTitle = req.body.includedSectionTitle
    if (req.body.faqEyebrow !== undefined) content.faqEyebrow = req.body.faqEyebrow
    if (req.body.faqSectionTitle !== undefined) content.faqSectionTitle = req.body.faqSectionTitle
    if (req.body.customSession !== undefined) content.customSession = req.body.customSession
    // Private & Premium page content
    if (req.body.ppHeaderTitle !== undefined) content.ppHeaderTitle = req.body.ppHeaderTitle
    if (req.body.ppHeaderDesc !== undefined) content.ppHeaderDesc = req.body.ppHeaderDesc
    if (req.body.ppEyebrow !== undefined) content.ppEyebrow = req.body.ppEyebrow
    if (req.body.ppSectionTitle !== undefined) content.ppSectionTitle = req.body.ppSectionTitle
    if (req.body.ppSectionDesc !== undefined) content.ppSectionDesc = req.body.ppSectionDesc
    if (req.body.ppCustomSession !== undefined) content.ppCustomSession = req.body.ppCustomSession
    if (req.body.ppCustomEyebrow !== undefined) content.ppCustomEyebrow = req.body.ppCustomEyebrow
    if (req.body.ppCustomSectionTitle !== undefined) content.ppCustomSectionTitle = req.body.ppCustomSectionTitle
    if (req.body.ppCustomItems !== undefined) content.ppCustomItems = req.body.ppCustomItems
    await content.save()
    res.json(content)
  } catch (err) { next(err) }
})

export default router
