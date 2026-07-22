import { Router } from 'express'
import Booking from '../models/Booking.js'
import { sendBookingNotification } from '../email.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {}
    const bookings = await Booking.find(filter).sort({ createdAt: -1 })
    res.json(bookings)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, email } = req.body
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' })
    const booking = await Booking.create({
      name, email,
      phone: req.body.phone || '',
      type: req.body.type || '',
      date: req.body.date || '',
      groupSize: req.body.groupSize || '1',
      experience: req.body.experience || '',
      message: req.body.message || '',
      status: req.body.status || 'pending',
      paymentMethod: req.body.paymentMethod || '',
      paymentStatus: req.body.paymentStatus || 'pending',
      paymentDetails: req.body.paymentDetails || {},
    })
    // Send email notification (don't block the response)
    sendBookingNotification(booking)
    res.status(201).json(booking)
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, phone, type, date, groupSize, experience, message, status, paymentMethod, paymentStatus, paymentDetails } = req.body
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, type, date, groupSize, experience, message, status, paymentMethod, paymentStatus, paymentDetails },
      { new: true, runValidators: true }
    )
    if (!booking) return res.status(404).json({ error: 'Not found' })
    res.json(booking)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
