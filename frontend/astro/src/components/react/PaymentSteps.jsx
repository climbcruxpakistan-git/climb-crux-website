import { Fragment } from 'react'
import { IconCheck } from './PaymentIcons'

const STEPS = [
  { number: 1, label: 'Your details' },
  { number: 2, label: 'Payment' },
  { number: 3, label: 'Confirmation' },
]

export default function PaymentSteps({ step }) {
  return (
    <nav className="pay-steps" aria-label="Booking progress">
      {STEPS.map((item, index) => {
        const state = item.number < step ? 'is-done' : item.number === step ? 'is-on' : ''
        return (
          <Fragment key={item.number}>
            <span className={`pay-step ${state}`} aria-current={item.number === step ? 'step' : undefined}>
              <i>{item.number < step ? <IconCheck size={13} /> : item.number}</i>
              {item.label}
            </span>
            {index < STEPS.length - 1 && (
              <span className={`pay-bar ${step > item.number ? 'is-done' : ''}`} aria-hidden="true" />
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
