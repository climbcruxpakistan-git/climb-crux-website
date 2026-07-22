import { Router } from 'express'
import Payment from '../models/Payment.js'
import Booking from '../models/Booking.js'

const router = Router()

// GET /api/payments/pending — returns payments awaiting verification with booking data
router.get('/pending', async (_req, res, next) => {
  try {
    const payments = await Payment.find({ status: 'verification_required' })
      .populate('booking_id')
      .sort({ created_at: -1 })
    res.json(payments)
  } catch (err) { next(err) }
})

// POST /api/payments/verify — approve or reject a payment
router.post('/verify', async (req, res, next) => {
  try {
    const { booking_id, action } = req.body

    if (!booking_id || !action) {
      return res.status(400).json({ error: 'booking_id and action (approve|reject) are required' })
    }
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be "approve" or "reject"' })
    }

    // Find the most recent pending payment for this booking
    const payment = await Payment.findOne({
      booking_id,
      status: 'verification_required',
    }).sort({ created_at: -1 })

    if (!payment) {
      return res.status(404).json({ error: 'No pending payment found for this booking' })
    }

    const booking = await Booking.findById(booking_id)
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (action === 'approve') {
      payment.status = 'paid'
      payment.paid_at = new Date()
      await payment.save()

      booking.payment_status = 'paid'
      booking.booking_status = 'confirmed'
      await booking.save()

res.json({
        success: true,
        message: 'Payment approved and booking confirmed',
        booking,
        payment: {
          id: payment._id,
          status: payment.status,
          paid_at: payment.paid_at,
        },
      })
    } else {
      payment.status = 'failed'
      await payment.save()

      booking.payment_status = 'failed'
      booking.booking_status = 'pending_payment'
      await booking.save()

res.json({
        success: true,
        message: 'Payment rejected',
        booking,
        payment: {
          id: payment._id,
          status: payment.status,
        },
      })
    }
  } catch (err) { next(err) }
})

export default router
