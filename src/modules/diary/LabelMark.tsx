import { COLOR_DOT } from '@/lib/colors'
import { cn } from '@/lib/utils'
import type { Mark } from './api'

export function LabelMark({ mark }: { mark: Mark | undefined }) {
  if (!mark) return null
  if (mark.emoji) return <span className="shrink-0 leading-none" aria-hidden>{mark.emoji}</span>
  return <span className={cn('size-2 shrink-0 rounded-full', COLOR_DOT[mark.color])} aria-hidden />
}
