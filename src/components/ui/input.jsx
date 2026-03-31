import * as React from 'react'
import { cn } from '../../lib/utils'

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/70 px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/60',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
