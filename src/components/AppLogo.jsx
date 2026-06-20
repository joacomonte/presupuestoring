import { cn } from '@/lib/utils'

// Logo de la app (Presupuestoring): recibo/ticket con signo "$".
export function AppLogo({ className }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Presupuestoring"
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id="pr-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#pr-logo-g)" />
      {/* Ticket/recibo con borde inferior dentado */}
      <path
        d="M20 14h24a2 2 0 0 1 2 2v30.5l-3.2-2.2-3.3 2.2-3.3-2.2-3.2 2.2-3.3-2.2-3.3 2.2-3.2-2.2L18 48.5V16a2 2 0 0 1 2-2Z"
        fill="#fff"
      />
      {/* Signo $ */}
      <text
        x="32"
        y="36"
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill="url(#pr-logo-g)"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        $
      </text>
    </svg>
  )
}
