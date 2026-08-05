import mongoose from 'mongoose'

/**
 * EmailLog — audit record for every email sent manually from the admin
 * dashboard (Manual Email Sender). Stores recipient, subject, message,
 * attachment references, the Resend message ID, delivery status, who sent
 * it, and when.
 */
const emailLogSchema = new mongoose.Schema({
  recipient: { type: String, required: true, index: true },
  subject: { type: String, required: true },
  message: { type: String, default: '' },
  // Attachment references only (name/type/size) — files are sent, not stored.
  attachments: [
    {
      name: { type: String, default: '' },
      type: { type: String, default: '' },
      size: { type: Number, default: 0 },
    },
  ],
  resend_message_id: { type: String, default: '' },
  delivery_status: {
    type: String,
    default: 'sent',
    enum: ['sent', 'failed'],
  },
  error: { type: String, default: '' },
  sent_by: { type: String, default: 'Admin' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

export default mongoose.model('EmailLog', emailLogSchema)
