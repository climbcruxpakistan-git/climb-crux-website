import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconCopy, IconError } from './PaymentIcons'

const SESSION_LABELS = {
  public: 'Public Session',
  private: 'Private Session',
  'private-starter': 'Starter Private',
  'private-advanced': 'Advanced Private',
  membership: 'Monthly Membership',
  'custom-group': 'Custom Group Session',
}

export function formatPayDate(value) {
  if (!value) return ''
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function getSessionLabel(booking) {
  const id = booking.session_id
  if (id === 'private-starter') return 'Starter Private'
  if (id === 'private-advanced') return 'Advanced Private'
  return booking.session_title || SESSION_LABELS[id] || id?.replace(/-/g, ' ') || 'Session'
}

export function getSessionKind(booking) {
  const id = String(booking.session_id || '')
  if (id === 'membership') return 'Membership'
  if (id === 'custom-group') return 'Group session'
  if (id.startsWith('private')) return 'Private session'
  return 'Public session'
}

export function CopyButton({ value, dark = false }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const area = document.createElement('textarea')
        area.value = value
        area.setAttribute('readonly', '')
        area.style.position = 'fixed'
        area.style.top = '-9999px'
        document.body.appendChild(area)
        area.select()
        document.execCommand('copy')
        document.body.removeChild(area)
      }
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      className={`pay-copy ${dark ? 'pay-copy-dark' : ''} ${copied ? 'is-copied' : ''}`}
      onClick={handleCopy}
      aria-label={`Copy ${value}`}
    >
      {copied ? <IconCheck size={11} /> : <IconCopy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export function ErrorBanner({ children }) {
  return (
    <div className="pay-error" role="alert">
      <IconError size={18} />
      <span>{children}</span>
    </div>
  )
}
