import { useEffect, useRef, useState } from 'react';
import './payment-submitted.css';

const STEPS = ['Your details', 'Payment', 'Confirmation'];

/** Shared progress bar for the booking flow. current: 1 | 2 | 3 */
export function PayStepper({ current = 3 }) {
  return (
    <ol className="pay-steps" aria-label="Booking progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? 'done' : n === current ? 'now' : 'todo';
        return (
          <li key={label} className={`pay-step is-${state}`} aria-current={state === 'now' ? 'step' : undefined}>
            <span className="pay-step-dot">
              {state === 'done' ? (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7.5l3.3 3.2L12 3.5" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : n}
            </span>
            <span className="pay-step-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Presentational "payment submitted" page body. Use it from BankTransferConfirmation.jsx
 * and EasyPaisaConfirmation.jsx; keep your own data loading and guards there.
 *
 * bookingNumber: 'CCS-00131'      sessionName: 'Advanced Private'
 * dateLabel: 'Wed, 11 Nov 2026' (already formatted)
 */
export default function PaymentSubmitted({
  bookingNumber,
  sessionName,
  dateLabel,
  statusLabel = 'Pending verification',
  homeHref = '/',
  statusHref = '/check-status/',
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(bookingNumber);
    } catch {
      const t = document.createElement('textarea');
      t.value = bookingNumber;
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      t.remove();
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="pay-sub">
      <PayStepper current={3} />

      <section className="pay-sub-col">
        <span className="pay-sub-check" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
        <h1>Payment proof received</h1>
        <p className="pay-sub-lead">
          We’re checking your transfer. Your spot is held while we verify, and we’ll email you within 24 hours.
        </p>

        <dl className="pay-sub-rows">
          <div>
            <dt>Booking reference</dt>
            <dd className="pay-sub-mono">
              {bookingNumber}
              <button type="button" className="pay-sub-copy" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
              <span className="pay-sub-sr" role="status" aria-live="polite">{copied ? 'Booking reference copied' : ''}</span>
            </dd>
          </div>
          {sessionName && <div><dt>Session</dt><dd>{sessionName}</dd></div>}
          {dateLabel && <div><dt>Date</dt><dd>{dateLabel}</dd></div>}
          <div><dt>Status</dt><dd><i className="pay-sub-dot" aria-hidden="true" />{statusLabel}</dd></div>
        </dl>

        <h2 className="pay-sub-h2">What happens next</h2>
        <ol className="pay-sub-next">
          <li className="is-done">
            <i aria-hidden="true"><svg width="12" height="12" viewBox="0 0 14 14"><path d="M2 7.5l3.3 3.2L12 3.5" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg></i>
            Proof received
          </li>
          <li><i aria-hidden="true" />We review your payment<small>Within 24 hours</small></li>
          <li className="is-later"><i aria-hidden="true" />You get a confirmation email<small>Check spam too</small></li>
        </ol>

        <div className="pay-sub-actions">
          <a className="pay-sub-btn" href={homeHref}>Back to home</a>
          <a className="pay-sub-link" href={statusHref}>Check status</a>
        </div>
      </section>
    </div>
  );
}
