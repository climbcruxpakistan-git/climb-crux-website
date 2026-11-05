function SvgIcon({ children, size = 18, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function IconBank({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <path d="M3 10h18" />
      <path d="m5 10 7-5 7 5" />
      <path d="M6 10v8M10 10v8M14 10v8M18 10v8" />
      <path d="M3 20h18" />
    </SvgIcon>
  )
}

export function IconPhone({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M11 18h2" />
    </SvgIcon>
  )
}

export function IconCard({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </SvgIcon>
  )
}

export function IconCheck({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <path d="m20 6-11 11-5-5" />
    </SvgIcon>
  )
}

export function IconCopy({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </SvgIcon>
  )
}

export function IconTag({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </SvgIcon>
  )
}

export function IconCalendar({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </SvgIcon>
  )
}

export function IconUser({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </SvgIcon>
  )
}

export function IconMail({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </SvgIcon>
  )
}

export function IconPhoneSmall({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.5 2.7a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6.4 6.4l1.1-1.1a2 2 0 0 1 2.1-.5c.9.2 1.8.4 2.7.5a2 2 0 0 1 1.7 2Z" />
    </SvgIcon>
  )
}

export function IconClock({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </SvgIcon>
  )
}

export function IconPin({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </SvgIcon>
  )
}

export function IconShield({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </SvgIcon>
  )
}

export function IconChat({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 21l1.9-4.9A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z" />
    </SvgIcon>
  )
}

export function IconUpload({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M20 16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3" />
    </SvgIcon>
  )
}

export function IconFile({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </SvgIcon>
  )
}

export function IconError({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </SvgIcon>
  )
}

export function IconArrowRight({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </SvgIcon>
  )
}

export function IconArrowLeft({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </SvgIcon>
  )
}

export function IconHome({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </SvgIcon>
  )
}

export function IconMountain({ size, className }) {
  return (
    <SvgIcon size={size} className={className}>
      <path d="m3 20 7-14 4 8 3-5 4 11Z" />
    </SvgIcon>
  )
}
