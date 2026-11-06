import type { Day, Mood } from './api'

export const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'joy', emoji: '😄', label: 'Радость' },
  { value: 'inspired', emoji: '🤩', label: 'Вдохновение' },
  { value: 'grateful', emoji: '🥰', label: 'Благодарность' },
  { value: 'calm', emoji: '😌', label: 'Спокойствие' },
  { value: 'neutral', emoji: '😐', label: 'Обычно' },
  { value: 'obsessed', emoji: '🔥', label: 'Одержимость' },
  { value: 'swings', emoji: '🎢', label: 'Качели' },
  { value: 'apathy', emoji: '😶', label: 'Апатия' },
  { value: 'tired', emoji: '😴', label: 'Усталость' },
  { value: 'sad', emoji: '😔', label: 'Грусть' },
  { value: 'anxious', emoji: '😰', label: 'Тревога' },
  { value: 'angry', emoji: '😠', label: 'Злость' },
]

// A day's moods, always in the same order as the picker.
export const moodsOf = (day: Day | undefined) => MOODS.filter(({ value }) => day?.moods.includes(value))
