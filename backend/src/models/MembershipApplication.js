import mongoose from 'mongoose'

/**
 * Membership Application — mirrors the Climb Crux "Monthly Rock Climbing
 * Membership Form" (the Word document is the single source of truth for the
 * public wording; this schema stores the answers to every field).
 */
const membershipApplicationSchema = new mongoose.Schema(
  {
    application_id: { type: String, default: '', unique: true, index: true },

    // ── Membership details ──
    membership_plan: { type: String, default: 'Monthly Membership (4 Sessions)' },
    membership_fee: { type: String, default: 'PKR 8,000 / Month' },
    membership_start_date: { type: String, default: '' },

    // ── Member information ──
    full_name: { type: String, required: true },
    date_of_birth: { type: String, default: '' },
    gender: { type: String, enum: ['', 'male', 'female'], default: '' },
    cnic: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, required: true },
    city: { type: String, default: '' },

    // ── Emergency contact ──
    emergency_contact_name: { type: String, default: '' },
    emergency_contact_relationship: { type: String, default: '' },
    emergency_contact_phone: { type: String, default: '' },

    // ── Climbing experience ──
    climbing_experience: { type: String, enum: ['', 'beginner', 'intermediate', 'advanced'], default: '' },
    climbed_outdoors_before: { type: String, enum: ['', 'yes', 'no'], default: '' },

    // ── Medical information ──
    medical_conditions: { type: String, default: '' },

    // ── Preferred climbing days ──
    preferred_days: { type: [String], default: [] }, // ['saturday', 'sunday']

    // ── Payment information ──
    payment_method: { type: String, enum: ['', 'bank_transfer', 'easypaisa'], default: '' },
    member_account_name: { type: String, default: '' },

    // ── Uploaded documents (Cloudinary URLs) ──
    cnic_file_url: { type: String, default: '' },
    bform_file_url: { type: String, default: '' },
    guardian_cnic_file_url: { type: String, default: '' },
    payment_screenshot_url: { type: String, default: '' },
    // Original file names kept for display/download
    cnic_file_name: { type: String, default: '' },
    bform_file_name: { type: String, default: '' },
    guardian_cnic_file_name: { type: String, default: '' },
    payment_screenshot_name: { type: String, default: '' },

    // ── Terms & conditions (exact wording ticked by the member) ──
    agreed_terms: { type: [String], default: [] },

    // ── Declaration & digital signature ──
    declaration_accepted: { type: Boolean, default: false },
    signature_name: { type: String, default: '' },
    signature_confirmed: { type: Boolean, default: false },
    signature_date: { type: String, default: '' }, // auto-generated at submission

    // ── Review status ──
    status: {
      type: String,
      default: 'pending_review',
      enum: ['pending_review', 'approved', 'rejected'],
    },
    payment_status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'paid', 'failed'],
    },
    membership_status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'active', 'expired', 'cancelled'],
    },

    // ── Office use only ──
    membership_id: { type: String, default: '' },
    verified_by: { type: String, default: '' },
    remarks: { type: String, default: '' },
    office_start_date: { type: String, default: '' },
    office_expiry_date: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

export default mongoose.model('MembershipApplication', membershipApplicationSchema)
