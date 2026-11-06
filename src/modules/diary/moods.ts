import { t } from '@/i18n'
import type { Day, Mood } from './api'

export const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'joy', emoji: '😄', label: t('mood.joy') },
  { value: 'inspired', emoji: '🤩', label: t('mood.inspired') },
  { value: 'grateful', emoji: '🥰', label: t('mood.grateful') },
  { value: 'calm', emoji: '😌', label: t('mood.calm') },
  { value: 'neutral', emoji: '😐', label: t('mood.neutral') },
  { value: 'obsessed', emoji: '🔥', label: t('mood.obsessed') },
  { value: 'swings', emoji: '🎢', label: t('mood.swings') },
  { value: 'apathy', emoji: '😶', label: t('mood.apathy') },
  { value: 'tired', emoji: '😴', label: t('mood.tired') },
  { value: 'sad', emoji: '😔', label: t('mood.sad') },
  { value: 'anxious', emoji: '😰', label: t('mood.anxious') },
  { value: 'angry', emoji: '😠', label: t('mood.angry') },
]

// A day's moods, always in the same order as the picker.
export const moodsOf = (day: Day | undefined) => MOODS.filter(({ value }) => day?.moods.includes(value))
