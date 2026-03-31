import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--color-primary)] text-white',
        secondary: 'border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text)]',
        outline: 'border-[var(--color-border)] text-[var(--color-text-muted)]',
        success: 'border-green-500/30 bg-green-500/15 text-green-300',
        danger: 'border-red-500/30 bg-red-500/15 text-red-300',
        warning: 'border-amber-500/30 bg-amber-500/15 text-amber-300'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge }
