import { useState } from 'react'
import { Loader2, RefreshCw, Trash2 } from 'lucide-react'

import { t } from '@/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { weekLabel } from '@/lib/dates'
import type { Summary } from './api'
import { ConfirmDelete } from './ConfirmDelete'

export const isWorking = ({ status }: Summary) => status === 'pending' || status === 'processing'

type SummaryCardProps = {
  summary: Summary
  onRedo: () => void
  onDelete: () => void
}

export function SummaryCard({ summary, onRedo, onDelete }: SummaryCardProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{weekLabel(summary.week)}</p>
        {!isWorking(summary) && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-xs" aria-label={t('journal.redoWeek')} onClick={onRedo}>
              <RefreshCw />
            </Button>
            <Button variant="ghost" size="icon-xs" aria-label={t('journal.deleteWeek')} onClick={() => setConfirming(true)}>
              <Trash2 />
            </Button>
          </div>
        )}
      </div>

      {isWorking(summary) && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {t('journal.readingWeek')}
        </p>
      )}

      {summary.status === 'failed' && (
        <p className="text-sm text-muted-foreground">{t('journal.weekRetry')}</p>
      )}

      {summary.status === 'done' && (
        <>
          <div className="flex flex-col gap-2">
            {summary.headline && <h2 className="text-xl font-semibold tracking-tight text-balance">{summary.headline}</h2>}
            <p className="text-sm leading-relaxed text-pretty">{summary.text}</p>
          </div>

          {summary.highlights.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <h3 className="text-xs font-medium text-muted-foreground">{t('journal.highlights')}</h3>
              <ul className="flex list-disc flex-col gap-1 pl-4 text-sm">
                {summary.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </section>
          )}

          {summary.focus && (
            <section className="flex flex-col gap-1.5">
              <h3 className="text-xs font-medium text-muted-foreground">{t('journal.focus')}</h3>
              <p className="text-sm">{summary.focus}</p>
            </section>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {summary.themes.map((theme) => (
              <Badge key={theme} variant="secondary">
                {theme}
              </Badge>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">{t('journal.noteCount', { count: summary.noteCount })}</span>
          </div>
        </>
      )}

      {confirming && (
        <ConfirmDelete
          title={t('journal.confirmWeek')}
          description={t('journal.confirmWeekText')}
          onCancel={() => setConfirming(false)}
          onConfirm={onDelete}
        />
      )}
    </article>
  )
}
