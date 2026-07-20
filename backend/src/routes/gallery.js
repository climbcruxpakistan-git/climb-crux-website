import { Router } from 'express'
import GalleryItem from '../models/GalleryItem.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const items = await GalleryItem.find().sort({ createdAt: 1 })
    res.json(items)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { tag, cat } = req.body
    if (!tag || !cat) return res.status(400).json({ error: 'Tag and category are required' })
    const item = await GalleryItem.create({
      tag, cat,
      imageUrl: req.body.imageUrl || '',
      caption: req.body.caption || '',
      photoSlug: req.body.photoSlug || '',
    })
    res.status(201).json(item)
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { tag, cat, imageUrl, caption } = req.body
    if (!tag || !cat) return res.status(400).json({ error: 'Tag and category are required' })
    const update = { tag, cat }
    if (imageUrl !== undefined) update.imageUrl = imageUrl
    if (caption !== undefined) update.caption = caption
    if (req.body.photoSlug !== undefined) update.photoSlug = req.body.photoSlug
    const item = await GalleryItem.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await GalleryItem.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
