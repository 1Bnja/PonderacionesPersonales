import * as React from 'react'
import { cn } from '../../lib/utils'

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/70 px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/60',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
