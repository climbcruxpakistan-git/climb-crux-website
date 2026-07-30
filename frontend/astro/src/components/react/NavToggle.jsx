import { useState } from 'react'

export default function NavToggle() {
  const [open, setOpen] = useState(false)

  function toggle() {
    const next = !open
    setOpen(next)
    const el = document.getElementById('navbar-links')
    if (el) {
      if (next) el.classList.add('is-open')
      else el.classList.remove('is-open')
    }
  }

  return (
    <button
      className={`navbar-toggle ${open ? 'is-open' : ''}`}
      onClick={toggle}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
    >
      <span></span>
      <span></span>
      <span></span>
      <style>{`
        .navbar-toggle {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 5px;
          width: 44px;
          height: 44px;
          background: rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 6px;
          padding: 0 8px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .navbar-toggle span {
          display: block;
          width: 100%;
          height: 3px;
          background: var(--charcoal);
          border-radius: 2px;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .navbar-toggle.is-open span:nth-child(1) {
          transform: translateY(8px) rotate(45deg);
        }
        .navbar-toggle.is-open span:nth-child(2) {
          opacity: 0;
        }
        .navbar-toggle.is-open span:nth-child(3) {
          transform: translateY(-8px) rotate(-45deg);
        }
        @media (min-width: 861px) {
          .navbar-toggle { display: none; }
        }
      `}</style>
    </button>
  )
}
