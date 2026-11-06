import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { t } from '@/i18n'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import * as api from './api'
import { DAYS_KEY, type Day, type Note } from './api'
import { ConfirmDelete } from './ConfirmDelete'

type DaySummaryProps = {
  date: string
  day: Day | undefined
  // The day's notes, to notice that they changed after the summary was written.
  notes: Note[]
}

function isOutdated(day: Day | undefined, notes: Note[]) {
  if (!day?.summary || !day.summarizedAt) return false
  const summarizedAt = new Date(day.summarizedAt)
  return notes.some((note) => new Date(note.updatedAt) > summarizedAt)
}

export function DaySummary({ date, day, notes }: DaySummaryProps) {
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const refresh = () => queryClient.invalidateQueries({ queryKey: DAYS_KEY })
  const working = day?.summaryStatus === 'pending' || day?.summaryStatus === 'processing'
  const outdated = isOutdated(day, notes)

  const summarize = useMutation({
    mutationFn: () => api.requestDaySummary(date, true),
    onSuccess: refresh,
    onError: (error) =>
      toast.error(
        error instanceof ApiError && error.status === 409
          ? t('journal.needNote')
          : t('journal.summaryFailed'),
      ),
  })

  const remove = useMutation({
    mutationFn: () => api.deleteDaySummary(date),
    onSuccess: refresh,
    onError: () => toast.error(t('journal.deleteFailed')),
  })

  if (working) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {t('journal.readingDay')}
      </p>
    )
  }

  if (!day?.summary) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="xs" disabled={summarize.isPending} onClick={() => summarize.mutate()}>
          <Sparkles />
          {t('journal.summarizeDay')}
        </Button>
        {day?.summaryStatus === 'failed' && (
          <p className="text-xs text-muted-foreground">{t('journal.summaryRetry')}</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 border-l-2 pl-3 text-sm text-muted-foreground">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p>{day.summary}</p>
        {day.focus && <p>{t('journal.tomorrow', { text: day.focus })}</p>}
        {outdated && <p className="text-xs text-foreground">{t('journal.outdated')}</p>}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          variant={outdated ? 'outline' : 'ghost'}
          size="icon-xs"
          aria-label={t('journal.redoDay')}
          disabled={summarize.isPending}
          onClick={() => summarize.mutate()}
        >
          <RefreshCw />
        </Button>
        <Button variant="ghost" size="icon-xs" aria-label={t('journal.deleteDay')} onClick={() => setConfirming(true)}>
          <Trash2 />
        </Button>
      </div>

      {confirming && (
        <ConfirmDelete
          title={t('journal.confirmDay')}
          description={t('journal.confirmDayText')}
          onCancel={() => setConfirming(false)}
          onConfirm={() => remove.mutate()}
        />
      )}
    </div>
  )
}
