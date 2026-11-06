import { t } from '@/i18n'
export const COLORS = ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'] as const
export type Color = (typeof COLORS)[number]

export const COLOR_LABELS: Record<Color, string> = {
  gray: t('color.gray'),
  red: t('color.red'),
  orange: t('color.orange'),
  yellow: t('color.yellow'),
  green: t('color.green'),
  blue: t('color.blue'),
  purple: t('color.purple'),
  pink: t('color.pink'),
}

// Full class names, so Tailwind can find them when it scans the source.
export const COLOR_DOT: Record<Color, string> = {
  gray: 'bg-neutral-400',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-400',
  green: 'bg-emerald-500',
  blue: 'bg-blue-500',
  purple: 'bg-violet-500',
  pink: 'bg-pink-500',
}

// For canvas drawing, where Tailwind classes do not apply.
export const COLOR_HEX: Record<Color, string> = {
  gray: '#a3a3a3',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#facc15',
  green: '#10b981',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
}
