import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { submitMembershipApplication, getMembershipFormUrl } from '../api.js'
import {
  MEMBERSHIP_PLAN,
  MEMBERSHIP_FEE,
  TERMS,
  DECLARATION,
  SIGNATURE_CONFIRMATION,
  BANK_DETAILS,
  EASYPAISA_DETAILS,
  isValidEmail,
  isValidPhone,
  computeAge,
  validateFile,
} from '../membershipFormData.js'
import './MembershipApply.css'

function getTodayString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function SectionTitle({ children }) {
  return <h3 className="mf-section-title">{children}</h3>
}

function RadioGroup({ label, name, options, value, onChange, error }) {
  return (
    <div className="mf-field">
      <span className="mf-label">{label}</span>
      <div className="mf-radio-row">
        {options.map((opt) => (
          <label key={opt.value} className={`mf-radio-card ${value === opt.value ? 'is-checked' : ''}`}>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="mf-error">{error}</p>}
    </div>
  )
}

function Checkbox({ checked, onChange, label, error, name = 'field' }) {
  return (
    <label className={`mf-checkbox ${error ? 'has-error' : ''}`}>
      <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="mf-checkbox-mark" aria-hidden="true" />
      <span className="mf-checkbox-label">{label}</span>
    </label>
  )
}

function FileUpload({ label, hint, file, onFile, error, name = 'file' }) {
  return (
    <div className="mf-field">
      <span className="mf-label">{label}</span>
      <label className={`mf-file-drop ${error ? 'has-error' : ''}`}>
        <input
          type="file"
          name={name}
          accept="application/pdf,image/jpeg,image/png"
          onChange={(e) => onFile(e.target.files[0] || null)}
        />
        {file ? (
          <span className="mf-file-picked">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            {file.name} <em>({(file.size / 1024 / 1024).toFixed(2)} MB)</em>
          </span>
        ) : (
          <span className="mf-file-prompt">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Click to upload — PDF, JPG, PNG · max 5 MB
          </span>
        )}
      </label>
      {hint && <p className="mf-hint">{hint}</p>}
      {error && <p className="mf-error">{error}</p>}
    </div>
  )
}

export default function MembershipApply() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    membership_start_date: '',
    full_name: '',
    date_of_birth: '',
    gender: '',
    cnic: '',
    phone: '',
    email: '',
    city: '',
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    climbing_experience: '',
    climbed_outdoors_before: '',
    medical_conditions: '',
    preferred_days: [],
    payment_method: '',
    member_account_name: '',
    agreed_terms: [],
    declaration_accepted: false,
    signature_name: '',
    signature_confirmed: false,
  })
  const [files, setFiles] = useState({
    cnic_file: null,
    bform_file: null,
    guardian_cnic_file: null,
    payment_screenshot: null,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submittedApp, setSubmittedApp] = useState(null)

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  const setFile = (key) => (file) => setFiles((f) => ({ ...f, [key]: file }))

  const age = computeAge(form.date_of_birth)
  const under18 = age !== null && age < 18
  const today = getTodayString()

  function toggleDay(day) {
    setForm((f) => ({
      ...f,
      preferred_days: f.preferred_days.includes(day)
        ? f.preferred_days.filter((d) => d !== day)
        : [...f.preferred_days, day],
    }))
  }

  function toggleTerm(term) {
    setForm((f) => ({
      ...f,
      agreed_terms: f.agreed_terms.includes(term)
        ? f.agreed_terms.filter((t) => t !== term)
        : [...f.agreed_terms, term],
    }))
  }

  function validate() {
    const e = {}
    if (!form.membership_start_date) e.membership_start_date = 'Select your membership start date'
    if (!form.full_name.trim()) e.full_name = 'Full name is required'
    if (!form.date_of_birth) {
      e.date_of_birth = 'Date of birth is required'
    } else if (age === null || new Date(form.date_of_birth) > new Date()) {
      e.date_of_birth = 'Enter a valid date of birth'
    }
    if (!form.gender) e.gender = 'Select your gender'
    if (!form.cnic.trim()) e.cnic = 'CNIC is required'
    if (!isValidPhone(form.phone)) e.phone = 'Enter a valid phone number (e.g. 0313 2690377)'
    if (!isValidEmail(form.email)) e.email = 'Enter a valid email address'
    if (!form.city.trim()) e.city = 'City is required'

    if (!form.emergency_contact_name.trim()) e.emergency_contact_name = 'Contact name is required'
    if (!form.emergency_contact_relationship.trim()) e.emergency_contact_relationship = 'Relationship is required'
    if (!isValidPhone(form.emergency_contact_phone)) e.emergency_contact_phone = 'Enter a valid phone number'

    if (!form.climbing_experience) e.climbing_experience = 'Select your experience level'
    if (!form.climbed_outdoors_before) e.climbed_outdoors_before = 'Please answer'

    if (form.preferred_days.length === 0) e.preferred_days = 'Select at least one preferred day'

    if (!form.payment_method) e.payment_method = 'Select a payment method'
    if (form.payment_method && !form.member_account_name.trim()) {
      e.member_account_name = 'Enter the account name used for payment'
    }

    if (under18) {
      const bformCheck = validateFile(files.bform_file)
      if (!bformCheck.ok) e.bform_file = bformCheck.error
      const guardianCheck = validateFile(files.guardian_cnic_file)
      if (!guardianCheck.ok) e.guardian_cnic_file = guardianCheck.error
    } else {
      const cnicCheck = validateFile(files.cnic_file)
      if (!cnicCheck.ok) e.cnic_file = cnicCheck.error
    }
    if (form.payment_method) {
      const shotCheck = validateFile(files.payment_screenshot)
      if (!shotCheck.ok) e.payment_screenshot = shotCheck.error
    }

    const missingTerms = TERMS.filter((t) => !form.agreed_terms.includes(t))
    if (missingTerms.length > 0) e.terms = 'Please tick every box to continue'
    if (!form.declaration_accepted) e.declaration_accepted = 'You must accept the declaration'
    if (!form.signature_name.trim()) e.signature_name = 'Type your full name as your digital signature'
    if (!form.signature_confirmed) e.signature_confirmed = 'Tick the box to confirm your typed name is your electronic signature'

    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    setServerError('')
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) {
      const firstError = document.querySelector('.mf-section .mf-error, .mf-error')
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    const fd = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length) fd.append(key, JSON.stringify(value))
      } else if (value !== '' && typeof value !== 'boolean') {
        // Booleans are appended below as explicit 'true'/'false' strings —
        // appending them here too would send the field twice, which multer
        // turns into an array and the backend would reject.
        fd.append(key, value)
      }
    })
    // Booleans that matter even when false
    fd.append('declaration_accepted', form.declaration_accepted ? 'true' : 'false')
    fd.append('signature_confirmed', form.signature_confirmed ? 'true' : 'false')
    fd.append('signature_date', today)
    Object.entries(files).forEach(([key, file]) => {
      if (file) fd.append(key, file)
    })

    try {
      const app = await submitMembershipApplication(fd)
      setSubmittedApp(app)
      window.scrollTo(0, 0)
    } catch (err) {
      setServerError(err.message || 'Application could not be submitted. Please try again.')
      window.scrollTo(0, 0)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Success screen ── */
  if (submittedApp) {
    return (
      <>
        <PageHeader title="Application received.">
          <p>
            Your membership application has been submitted. Our team will review it and confirm your payment shortly.
          </p>
        </PageHeader>
        <section className="section">
          <div className="wrap">
            <div className="mf-success-card" style={{ maxWidth: 640, margin: '0 auto' }}>
              <div className="mf-success-icon">✓</div>
              <h2>Thank you{submittedApp.full_name ? `, ${submittedApp.full_name.split(' ')[0]}` : ''}!</h2>
              <p className="mf-success-sub">
                Your Monthly Membership (4 Sessions) application is now <strong>Pending Review</strong>.
              </p>
              <div className="mf-success-id">
                <span>Membership Application ID</span>
                <strong>{submittedApp.application_id || '—'}</strong>
              </div>
              <ul className="mf-success-steps">
                <li>A confirmation email has been sent to <strong>{submittedApp.email}</strong>.</li>
                <li>We will verify your documents and payment (usually within 24–48 hours).</li>
                <li>Once approved, you'll receive your membership ID and activation details by email.</li>
              </ul>
              <div className="form-actions" style={{ flexDirection: 'column' }}>
                <Link to="/book-now" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Back to Book a Session
                </Link>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate('/')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Go to Homepage
                </button>
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Apply for Membership.">
        <p>
          Complete your membership application online.
        </p>
      </PageHeader>

      <section className="section">
        <div className="wrap">
          <div className="mf-form-card" style={{ maxWidth: 760, margin: '0 auto' }}>
            {serverError && (
              <div className="form-error-banner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {serverError}
              </div>
            )}

            {/* Membership summary */}
            <div className="mf-plan-bar">
              <div>
                <span className="mf-plan-name">{MEMBERSHIP_PLAN}</span>
                <span className="mf-plan-fee">{MEMBERSHIP_FEE}</span>
              </div>
              <a
                href={getMembershipFormUrl()}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              >
                Download PDF
              </a>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* ── 1 · Membership Details ── */}
              <div className="mf-section">
                <SectionTitle>Membership Details</SectionTitle>
                <div className="mf-field">
                  <span className="mf-label">Membership Start Date</span>
                  <input
                    type="date"
                    min={today}
                    value={form.membership_start_date}
                    onChange={(e) => set('membership_start_date')(e.target.value)}
                  />
                  {errors.membership_start_date && <p className="mf-error">{errors.membership_start_date}</p>}
                </div>
              </div>

              {/* ── 2 · Member Information ── */}
              <div className="mf-section">
                <SectionTitle>Member Information</SectionTitle>
                <div className="mf-grid-2">
                  <div className="mf-field">
                    <span className="mf-label">Full Name</span>
                    <input type="text" value={form.full_name} onChange={(e) => set('full_name')(e.target.value)} />
                    {errors.full_name && <p className="mf-error">{errors.full_name}</p>}
                  </div>
                  <div className="mf-field">
                    <span className="mf-label">Date of Birth</span>
                    <input type="date" value={form.date_of_birth} onChange={(e) => set('date_of_birth')(e.target.value)} />
                    {errors.date_of_birth && <p className="mf-error">{errors.date_of_birth}</p>}
                  </div>
                </div>

                <RadioGroup
                  label="Gender"
                  name="gender"
                  value={form.gender}
                  onChange={set('gender')}
                  error={errors.gender}
                  options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
                />

                <div className="mf-grid-2">
                  <div className="mf-field">
                    <span className="mf-label">CNIC</span>
                    <input type="text" placeholder="e.g. 12345-1234567-1" value={form.cnic} onChange={(e) => set('cnic')(e.target.value)} />
                    {errors.cnic && <p className="mf-error">{errors.cnic}</p>}
                  </div>
                  <div className="mf-field">
                    <span className="mf-label">Phone Number</span>
                    <input type="tel" placeholder="e.g. 0313 2690377" value={form.phone} onChange={(e) => set('phone')(e.target.value)} />
                    {errors.phone && <p className="mf-error">{errors.phone}</p>}
                  </div>
                </div>

                <div className="mf-grid-2">
                  <div className="mf-field">
                    <span className="mf-label">Email Address</span>
                    <input type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} />
                    {errors.email && <p className="mf-error">{errors.email}</p>}
                  </div>
                  <div className="mf-field">
                    <span className="mf-label">City</span>
                    <input type="text" value={form.city} onChange={(e) => set('city')(e.target.value)} />
                    {errors.city && <p className="mf-error">{errors.city}</p>}
                  </div>
                </div>
              </div>

              {/* ── 3 · Emergency Contact ── */}
              <div className="mf-section">
                <SectionTitle>Emergency Contact</SectionTitle>
                <div className="mf-grid-2">
                  <div className="mf-field">
                    <span className="mf-label">Contact Name</span>
                    <input type="text" value={form.emergency_contact_name} onChange={(e) => set('emergency_contact_name')(e.target.value)} />
                    {errors.emergency_contact_name && <p className="mf-error">{errors.emergency_contact_name}</p>}
                  </div>
                  <div className="mf-field">
                    <span className="mf-label">Relationship</span>
                    <input type="text" value={form.emergency_contact_relationship} onChange={(e) => set('emergency_contact_relationship')(e.target.value)} />
                    {errors.emergency_contact_relationship && <p className="mf-error">{errors.emergency_contact_relationship}</p>}
                  </div>
                </div>
                <div className="mf-field">
                  <span className="mf-label">Phone Number</span>
                  <input type="tel" value={form.emergency_contact_phone} onChange={(e) => set('emergency_contact_phone')(e.target.value)} />
                  {errors.emergency_contact_phone && <p className="mf-error">{errors.emergency_contact_phone}</p>}
                </div>
              </div>

              {/* ── 4 · Climbing Experience ── */}
              <div className="mf-section">
                <SectionTitle>Climbing Experience</SectionTitle>
                <RadioGroup
                  label="How would you describe your climbing experience?"
                  name="climbing_experience"
                  value={form.climbing_experience}
                  onChange={set('climbing_experience')}
                  error={errors.climbing_experience}
                  options={[
                    { value: 'beginner', label: 'Beginner' },
                    { value: 'intermediate', label: 'Intermediate' },
                    { value: 'advanced', label: 'Advanced' },
                  ]}
                />
                <RadioGroup
                  label="Have you climbed outdoors before?"
                  name="climbed_outdoors_before"
                  value={form.climbed_outdoors_before}
                  onChange={set('climbed_outdoors_before')}
                  error={errors.climbed_outdoors_before}
                  options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                />
              </div>

              {/* ── 5 · Medical Information ── */}
              <div className="mf-section">
                <SectionTitle>Medical Information</SectionTitle>
                <div className="mf-field">
                  <span className="mf-label">
                    Please mention any medical conditions, allergies, injuries or other information that our instructors should be aware of.
                  </span>
                  <textarea
                    rows={4}
                    placeholder="Optional — leave blank if none"
                    value={form.medical_conditions}
                    onChange={(e) => set('medical_conditions')(e.target.value)}
                  />
                </div>
              </div>

              {/* ── 6 · Preferred Climbing Days ── */}
              <div className="mf-section">
                <SectionTitle>Preferred Climbing Days</SectionTitle>
                <div className="mf-radio-row">
                  {[
                    { value: 'saturday', label: 'Saturday' },
                    { value: 'sunday', label: 'Sunday' },
                  ].map((day) => (
                    <label key={day.value} className={`mf-radio-card ${form.preferred_days.includes(day.value) ? 'is-checked' : ''}`}>
                      <input
                        type="checkbox"
                        name="preferred_days"
                        checked={form.preferred_days.includes(day.value)}
                        onChange={() => toggleDay(day.value)}
                      />
                      <span>{day.label}</span>
                    </label>
                  ))}
                </div>
                {errors.preferred_days && <p className="mf-error">{errors.preferred_days}</p>}
              </div>

              {/* ── 7 · Payment Information ── */}
              <div className="mf-section">
                <SectionTitle>Payment Information</SectionTitle>
                <RadioGroup
                  label="Payment Method"
                  name="payment_method"
                  value={form.payment_method}
                  onChange={set('payment_method')}
                  error={errors.payment_method}
                  options={[
                    { value: 'bank_transfer', label: 'Bank Transfer' },
                    { value: 'easypaisa', label: 'Easypaisa' },
                  ]}
                />

                {form.payment_method === 'bank_transfer' && (
                  <div className="mf-account-box">
                    <div className="mf-account-box-title">🏦 Bank Transfer — our account</div>
                    <p>Bank: <strong>{BANK_DETAILS.bank}</strong></p>
                    <p>Account Name: <strong>{BANK_DETAILS.account_name}</strong></p>
                    <p>IBAN: <strong style={{ fontFamily: 'monospace' }}>{BANK_DETAILS.iban}</strong></p>
                  </div>
                )}
                {form.payment_method === 'easypaisa' && (
                  <div className="mf-account-box">
                    <div className="mf-account-box-title">📱 Easypaisa — our account</div>
                    <p>Account Name: <strong>{EASYPAISA_DETAILS.account_name}</strong></p>
                    <p>Account Number: <strong>{EASYPAISA_DETAILS.account_number}</strong></p>
                  </div>
                )}

                {form.payment_method && (
                  <>
                    <div className="mf-field">
                      <span className="mf-label">Member Account Name</span>
                      <input
                        type="text"
                        placeholder="The account name you paid from"
                        value={form.member_account_name}
                        onChange={(e) => set('member_account_name')(e.target.value)}
                      />
                      {errors.member_account_name && <p className="mf-error">{errors.member_account_name}</p>}
                    </div>
                    <FileUpload
                      label="Payment Screenshot"
                      hint="Upload the screenshot of your Bank Transfer or Easypaisa payment."
                      file={files.payment_screenshot}
                      onFile={setFile('payment_screenshot')}
                      error={errors.payment_screenshot}
                    />
                  </>
                )}
              </div>

              {/* ── 8 · Document Uploads ── */}
              <div className="mf-section">
                <SectionTitle>Document Uploads</SectionTitle>
                {under18 ? (
                  <>
                    <FileUpload
                      label="B-Form (required — under 18)"
                      hint="For participants under 18 years of age, a copy of the B-Form must be attached."
                      file={files.bform_file}
                      onFile={setFile('bform_file')}
                      error={errors.bform_file}
                    />
                    <FileUpload
                      label="Parent / Guardian CNIC (required — under 18)"
                      hint="A copy of the parent or legal guardian's CNIC must be attached."
                      file={files.guardian_cnic_file}
                      onFile={setFile('guardian_cnic_file')}
                      error={errors.guardian_cnic_file}
                    />
                  </>
                ) : (
                  <>
                    <FileUpload
                      label="Participant CNIC"
                      hint="A copy of the participant's CNIC must be attached to this form."
                      file={files.cnic_file}
                      onFile={setFile('cnic_file')}
                      error={errors.cnic_file}
                    />
                    <p className="mf-hint mf-age-note">
                      Age on form: {age !== null ? `${age} years` : '—'} — B-Form &amp; guardian CNIC are only required for participants under 18.
                    </p>
                  </>
                )}
              </div>

              {/* ── 9 · Terms & Conditions ── */}
              <div className="mf-section">
                <SectionTitle>Membership Terms &amp; Conditions</SectionTitle>
                <p className="mf-hint">Please read and tick each box.</p>
                <div className="mf-terms-list">
                  {TERMS.map((term, i) => (
                    <Checkbox
                      key={i}
                      label={term}
                      checked={form.agreed_terms.includes(term)}
                      onChange={() => toggleTerm(term)}
                    />
                  ))}
                </div>
                {errors.terms && <p className="mf-error">{errors.terms}</p>}
              </div>

              {/* ── 10 · Member Declaration & Signature ── */}
              <div className="mf-section">
                <SectionTitle>Member Declaration</SectionTitle>
                <div className="mf-declaration">
                  {DECLARATION}
                </div>
                <div className="mf-grid-2">
                  <div className="mf-field">
                    <span className="mf-label">Member Name</span>
                    <input type="text" value={form.full_name} disabled />
                  </div>
                  <div className="mf-field">
                    <span className="mf-label">Date</span>
                    <input type="text" value={today} disabled />
                  </div>
                </div>

                <div className="mf-field">
                  <span className="mf-label">Digital Signature — Full Name</span>
                  <input
                    type="text"
                    placeholder="Type your full name"
                    value={form.signature_name}
                    onChange={(e) => set('signature_name')(e.target.value)}
                  />
                  {errors.signature_name && <p className="mf-error">{errors.signature_name}</p>}
                </div>
                <div className="mf-signature-line" />

                <Checkbox
                  label={SIGNATURE_CONFIRMATION}
                  checked={form.signature_confirmed}
                  onChange={set('signature_confirmed')}
                  error={errors.signature_confirmed}
                />
                <Checkbox
                  label="I accept the Member Declaration above."
                  checked={form.declaration_accepted}
                  onChange={set('declaration_accepted')}
                  error={errors.declaration_accepted}
                />
              </div>

              <div className="form-actions" style={{ flexDirection: 'column' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {submitting ? <><span className="btn-spinner" /> Submitting application…</> : 'Submit Membership Application'}
                </button>
                <p className="mf-hint" style={{ textAlign: 'center', marginBottom: 0 }}>
                  By submitting, your application is recorded as <strong>Pending Review</strong> and a confirmation email will be sent to you.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
