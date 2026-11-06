import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { locale, t } from '@/i18n'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { parseLocalDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import * as api from './api'
import { DAYS_KEY } from './api'
import { DaySummary } from './DaySummary'
import { MOODS } from './moods'
import { useDays } from './useDays'

const SCORES = Array.from({ length: 10 }, (_, index) => index + 1)
const dayFormat = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' })

type DayDialogProps = {
  date: string
  onClose: () => void
}

export function DayDialog({ date, onClose }: DayDialogProps) {
  const queryClient = useQueryClient()
  const { byDate } = useDays()
  const day = byDate.get(date)
  const moods = day?.moods ?? []
  const score = day?.score ?? null
  const refresh = () => queryClient.invalidateQueries({ queryKey: DAYS_KEY })

  const mark = useMutation({
    mutationFn: (next: Pick<api.Day, 'moods' | 'score'>) => api.updateDay(date, next),
    onSettled: refresh,
    onError: () => toast.error(t('journal.scoreFailed')),
  })

  function toggleMood(mood: api.Mood) {
    const next = moods.includes(mood) ? moods.filter((other) => other !== mood) : [...moods, mood]
    mark.mutate({ moods: next, score })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="first-letter:uppercase">{dayFormat.format(parseLocalDate(date))}</DialogTitle>
          <DialogDescription>{t('journal.howWasDay')}</DialogDescription>
        </DialogHeader>

        <div role="group" aria-label={t('journal.mood')} className="grid grid-cols-3 gap-1 sm:grid-cols-4">
          {MOODS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={moods.includes(option.value)}
              onClick={() => toggleMood(option.value)}
              className={cn(
                'flex min-w-0 flex-col items-center gap-1 rounded-lg p-1.5 text-[0.65rem] text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                moods.includes(option.value) && 'bg-muted font-medium text-foreground ring-1 ring-foreground/20',
              )}
            >
              <span className="text-2xl leading-none" aria-hidden>
                {option.emoji}
              </span>
              <span className="w-full truncate text-center">{option.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">{t('journal.howGood')}</p>
          <div role="group" aria-label={t('journal.score')} className="grid grid-cols-10 gap-1">
            {SCORES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={score === value}
                onClick={() => mark.mutate({ moods, score: score === value ? null : value })}
                className={cn(
                  'flex h-9 items-center justify-center rounded-md text-sm tabular-nums outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                  score === value && 'bg-primary text-primary-foreground hover:bg-primary/80',
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <DaySummary date={date} day={day} notes={[]} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
