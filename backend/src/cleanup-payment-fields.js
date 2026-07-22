/**
 * One-time cleanup: Reset payment-related fields on existing bookings.
 * Run with: node src/cleanup-payment-fields.js
 *
 * This script:
 * 1. Removes old payment fields: paymentGateway, gatewayTransactionId, paidAt
 * 2. Resets paymentMethod, paymentStatus, paymentDetails to defaults
 * 3. Changes 'payment_pending' statuses to 'pending'
 *
 * It does NOT delete any bookings.
 */
import 'dotenv/config'
import dns from 'dns'
import mongoose from 'mongoose'

// Use Google DNS to resolve MongoDB Atlas SRV records (often blocked by ISP)
dns.setServers(['8.8.8.8', '1.1.1.1'])

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/climb-crux'

async function cleanup() {
  console.log(`Connecting to MongoDB...`)
  await mongoose.connect(MONGODB_URI)
  console.log('Connected.\n')

  const db = mongoose.connection.db

  // Step 1: Remove payment fields that no longer exist in the schema
  const unsetResult = await db.collection('bookings').updateMany({}, {
    $unset: {
      paymentGateway: '',
      gatewayTransactionId: '',
      paidAt: '',
    },
  })
  console.log(`  ✓ Removed old payment fields from ${unsetResult.modifiedCount} bookings`)

  // Step 2: Reset paymentMethod and paymentStatus to defaults
  const resetResult = await db.collection('bookings').updateMany(
    { paymentMethod: { $ne: '' }, paymentStatus: { $ne: 'pending' } },
    {
      $set: {
        paymentMethod: '',
        paymentStatus: 'pending',
        paymentDetails: {
          yourBank: '',
          accountHolder: '',
          tracker: '',
          amount: 0,
        },
      },
    }
  )
  console.log(`  ✓ Reset payment method/status on ${resetResult.modifiedCount} bookings`)

  // Step 3: Change any 'payment_pending' statuses to 'pending'
  const statusResult = await db.collection('bookings').updateMany(
    { status: 'payment_pending' },
    { $set: { status: 'pending' } }
  )
  console.log(`  ✓ Changed 'payment_pending' → 'pending' for ${statusResult.modifiedCount} bookings`)

  // Step 4: Remove any old payment detail fields from the embedded paymentDetails object
  const detailsResult = await db.collection('bookings').updateMany(
    {
      $or: [
        { 'paymentDetails.cardHolder': { $exists: true } },
        { 'paymentDetails.cardLastFour': { $exists: true } },
        { 'paymentDetails.cardExpiry': { $exists: true } },
        { 'paymentDetails.yourAccountNumber': { $exists: true } },
        { 'paymentDetails.phone': { $exists: true } },
        { 'paymentDetails.transactionId': { $exists: true } },
      ],
    },
    {
      $unset: {
        'paymentDetails.cardHolder': '',
        'paymentDetails.cardLastFour': '',
        'paymentDetails.cardExpiry': '',
        'paymentDetails.yourAccountNumber': '',
        'paymentDetails.phone': '',
        'paymentDetails.transactionId': '',
      },
    }
  )
  console.log(`  ✓ Cleaned old paymentDetails sub-fields on ${detailsResult.modifiedCount} bookings`)

  // Summary
  const total = await db.collection('bookings').countDocuments()
  console.log(`\n✅ Done. ${total} total bookings in database.`)

  await mongoose.disconnect()
}

cleanup().catch((err) => {
  console.error('Cleanup failed:', err)
  process.exit(1)
})
