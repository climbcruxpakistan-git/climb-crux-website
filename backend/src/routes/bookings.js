import { Router } from 'express'
import Booking from '../models/Booking.js'
import Payment from '../models/Payment.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const filter = req.query.booking_status ? { booking_status: req.query.booking_status } : {}
    const bookings = await Booking.find(filter).sort({ created_at: -1 })
    res.json(bookings)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { customer_name, customer_email } = req.body
    if (!customer_name || !customer_email) {
      return res.status(400).json({ error: 'customer_name and customer_email are required' })
    }

    // Auto-generate booking number: CCP-YYYY-XXXXX (sequential)
    const year = new Date().getFullYear()
    const count = await Booking.countDocuments()
    const booking_number = `CCP-${year}-${String(count + 1).padStart(5, '0')}`

    const booking = await Booking.create({
      booking_number,
      customer_name,
      customer_email,
      customer_phone: req.body.customer_phone || '',
      session_id: req.body.session_id || '',
      date: req.body.date || '',
      participants: req.body.participants || 1,
      amount: req.body.amount || 0,
      booking_status: req.body.booking_status || 'pending_payment',
      payment_method: req.body.payment_method || '',
      payment_status: req.body.payment_status || 'pending',
    })

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
    const booking = await Booking.findOne({ booking_number: req.params.bookingNumber })
    if (!booking) return res.status(404).json({ error: 'Not found' })
    res.json(booking)
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const {
      customer_name, customer_email, customer_phone,
      session_id, date, participants, amount,
      booking_status, payment_method, payment_status,
      payer_bank, payer_name, payer_phone,
    } = req.body

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        customer_name, customer_email, customer_phone,
        session_id, date, participants, amount,
        booking_status, payment_method, payment_status,
        payer_bank, payer_name, payer_phone,
      },
      { new: true, runValidators: true }
    )
    if (!booking) return res.status(404).json({ error: 'Not found' })
    res.json(booking)
  } catch (err) { next(err) }
})

router.patch('/:id/booking-status', async (req, res, next) => {
  try {
    const { booking_status } = req.body
    if (!['pending_payment', 'pending_verification', 'confirmed', 'cancelled'].includes(booking_status)) {
      return res.status(400).json({
        error: 'booking_status must be pending_payment, pending_verification, confirmed, or cancelled',
      })
    }
    const existing = await Booking.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { booking_status },
      { new: true, runValidators: true }
    )
    res.json(booking)
  } catch (err) { next(err) }
})

router.patch('/:id/payment-status', async (req, res, next) => {
  try {
    const { payment_status } = req.body
    if (!['pending', 'verification_required', 'paid', 'failed', 'refunded'].includes(payment_status)) {
      return res.status(400).json({
        error: 'payment_status must be pending, verification_required, paid, failed, or refunded',
      })
    }
    const existing = await Booking.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { payment_status },
      { new: true, runValidators: true }
    )
    res.json(booking)
  } catch (err) { next(err) }
})

router.post('/:id/create-payment', async (req, res, next) => {
  try {
    const { method, payer_name, payer_bank, payer_phone } = req.body
    if (!method) {
      return res.status(400).json({ error: 'Payment method is required' })
    }

    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })

    // Create Payment record
    const payment = await Payment.create({
      booking_id: booking._id,
      method,
      status: 'verification_required',
      payer_name: payer_name || '',
      payer_bank: payer_bank || '',
      metadata: { payer_phone: payer_phone || '' },
    })

    // Update booking
    booking.payment_method = method
    booking.payment_status = 'verification_required'
    booking.booking_status = 'pending_verification'
    if (payer_name) booking.payer_name = payer_name
    if (payer_bank) booking.payer_bank = payer_bank
    if (payer_phone) booking.payer_phone = payer_phone
    await booking.save()

    res.json({
      booking,
      payment: {
        id: payment._id,
        method: payment.method,
        status: payment.status,
      },
    })
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Not found' })
    // Also delete any associated payment records
    await Payment.deleteMany({ booking_id: req.params.id })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
