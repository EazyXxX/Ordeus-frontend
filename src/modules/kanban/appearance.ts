import { ArrowDown, ArrowUp, ChevronsUp, Equal, type LucideIcon } from 'lucide-react'

import type { Color } from '@/lib/colors'
import { cn } from '@/lib/utils'

export const COLOR_EDGE: Record<Color, string> = {
  gray: 'border-l-neutral-400',
  red: 'border-l-red-500',
  orange: 'border-l-orange-500',
  yellow: 'border-l-yellow-400',
  green: 'border-l-emerald-500',
  blue: 'border-l-blue-500',
  purple: 'border-l-violet-500',
  pink: 'border-l-pink-500',
}

export function cardClass(color: Color | '') {
  return cn('rounded-md border bg-card p-2.5', color && ['border-l-4', COLOR_EDGE[color]])
}

export const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'] as const
export type Priority = (typeof PRIORITIES)[number]

export const PRIORITY_LABELS: Record<Priority, string> = {
  none: 'Без приоритета',
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  urgent: 'Срочный',
}

export const PRIORITY_ICONS: Record<Exclude<Priority, 'none'>, { icon: LucideIcon; className: string }> = {
  low: { icon: ArrowDown, className: 'text-blue-500' },
  medium: { icon: Equal, className: 'text-yellow-500' },
  high: { icon: ArrowUp, className: 'text-orange-500' },
  urgent: { icon: ChevronsUp, className: 'text-red-500' },
}

function localDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function isOverdue(dueDate: string | null) {
  return dueDate !== null && dueDate < localDate(new Date())
}

const dueFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })

export function formatDue(dueDate: string) {
  const [year, month, day] = dueDate.split('-').map(Number)
  return dueFormat.format(new Date(year, month - 1, day))
}
