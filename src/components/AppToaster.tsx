import type { CSSProperties } from 'react'
import { Toaster } from 'sonner'

// The app's own color tokens, so toasts follow the theme without extra wiring.
const tokens = {
  '--normal-bg': 'var(--popover)',
  '--normal-text': 'var(--popover-foreground)',
  '--normal-border': 'var(--border)',
} as CSSProperties

export function AppToaster() {
  return <Toaster position="bottom-right" closeButton style={tokens} />
}
