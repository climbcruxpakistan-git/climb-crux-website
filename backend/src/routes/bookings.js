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

    // Auto-generate booking number: CCP-YYYY-XXXXX (sequential)
    const year = new Date().getFullYear()
    const count = await Booking.countDocuments()
    const bookingNumber = `CCP-${year}-${String(count + 1).padStart(5, '0')}`

    const booking = await Booking.create({
      bookingNumber,
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
      history: [{
        type: 'booking_created',
        description: 'Booking created',
        timestamp: new Date(),
        details: { type: req.body.type, date: req.body.date, bookingNumber },
      }],
    })
    // Send email notification (don't block the response)
    sendBookingNotification(booking)
    res.status(201).json(booking)
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Not found' })
    res.json(booking)
  } catch (err) { next(err) }
})

router.get('/by-number/:bookingNumber', async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ bookingNumber: req.params.bookingNumber })
    if (!booking) return res.status(404).json({ error: 'Not found' })
    res.json(booking)
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, phone, type, date, groupSize, experience, message, status, paymentMethod, paymentStatus, paymentDetails } = req.body
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        name, email, phone, type, date, groupSize, experience, message, status, paymentMethod, paymentStatus, paymentDetails,
        $push: {
          history: {
            type: 'booking_updated',
            description: 'Booking details updated by admin',
            timestamp: new Date(),
            details: { updated: Object.keys(req.body).filter(k => k !== 'history').join(', ') },
          },
        },
      },
      { new: true, runValidators: true }
    )
    if (!booking) return res.status(404).json({ error: 'Not found' })
    res.json(booking)
  } catch (err) { next(err) }
})

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['pending', 'payment_pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status must be pending, payment_pending, confirmed, or cancelled' })
    }
    const statusLabels = { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled' }
    // Fetch existing booking first to capture the previous status for history
    const existing = await Booking.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        $push: {
          history: {
            type: 'status_changed',
            description: `Booking status changed to ${statusLabels[status] || status}`,
            timestamp: new Date(),
            details: { from: existing.status || 'unknown', to: status },
          },
        },
      },
      { new: true, runValidators: true }
    )
    res.json(booking)
  } catch (err) { next(err) }
})

router.patch('/:id/payment-status', async (req, res, next) => {
  try {
    const { paymentStatus } = req.body
    if (!['pending', 'awaiting_confirmation', 'paid', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({ error: 'Payment status must be pending, awaiting_confirmation, paid, or failed' })
    }
    const paymentLabels = { pending: 'Pending', awaiting_confirmation: 'Awaiting Confirmation', paid: 'Paid', failed: 'Failed' }
    // Fetch existing booking first to capture the previous payment status for history
    const existing = await Booking.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus,
        $push: {
          history: {
            type: 'payment_status_changed',
            description: `Payment status changed to ${paymentLabels[paymentStatus] || paymentStatus}`,
            timestamp: new Date(),
            details: { from: existing.paymentStatus || 'unknown', to: paymentStatus },
          },
        },
      },
      { new: true, runValidators: true }
    )
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
