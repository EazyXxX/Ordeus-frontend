export const COLORS = ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'] as const
export type Color = (typeof COLORS)[number]

export const COLOR_LABELS: Record<Color, string> = {
  gray: 'Серый',
  red: 'Красный',
  orange: 'Оранжевый',
  yellow: 'Жёлтый',
  green: 'Зелёный',
  blue: 'Синий',
  purple: 'Фиолетовый',
  pink: 'Розовый',
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
