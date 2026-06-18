import { cn } from '@/lib/utils'

export function Logo({ className }) {
  return (
    <img
      src="/logo.jpg"
      alt="Blaster Detailing"
      className={cn('shrink-0 rounded-xl object-cover', className)}
    />
  )
}
