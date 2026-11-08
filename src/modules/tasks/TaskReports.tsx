import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Loader2, RefreshCw, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

import { locale, t } from '@/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { parseLocalDate, weekLabel, weekStart } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { ConfirmDelete } from '@/modules/diary/ConfirmDelete'
import * as api from './api'
import { REPORTS_KEY, type Column, type Report, type ReportStats } from './api'
import { PRIORITY_ICONS, PRIORITY_LABELS, type Priority } from './appearance'

const dayFormat = new Intl.DateTimeFormat(locale, { weekday: 'short' })
const doneFormat = new Intl.DateTimeFormat(locale, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const createdFormat = new Intl.DateTimeFormat(locale, {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})
const hoursFormat = new Intl.NumberFormat(locale, {
  style: 'unit',
  unit: 'hour',
  unitDisplay: 'short',
  maximumFractionDigits: 0,
})
const daysFormat = new Intl.NumberFormat(locale, {
  style: 'unit',
  unit: 'day',
  unitDisplay: 'short',
  maximumFractionDigits: 1,
})

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

function formatDuration(hours: number) {
  return hours < 24 ? hoursFormat.format(Math.max(hours, 1)) : daysFormat.format(hours / 24)
}

// Mondays from the week of the oldest task to this week, newest first.
function weeksSince(first: string, current: string) {
  const weeks: string[] = []
  for (let day = parseLocalDate(current); weekStart(day) >= first; day.setDate(day.getDate() - 7)) {
    weeks.push(weekStart(day))
  }
  return weeks
}

export function TaskReports({ columns }: { columns: Column[] }) {
  const queryClient = useQueryClient()
  const reports = useQuery({
    queryKey: REPORTS_KEY,
    queryFn: api.fetchReports,
  })
  const [currentWeek] = useState(() => weekStart(new Date()))

  const weeks = useMemo(() => {
    const starts = [
      ...columns.flatMap((column) => column.cards.map((card) => weekStart(new Date(card.createdAt)))),
      ...(reports.data ?? []).map((report) => report.week),
    ]
    if (starts.length === 0) return []
    return weeksSince(
      starts.reduce((first, week) => (week < first ? week : first)),
      currentWeek,
    )
  }, [columns, reports.data, currentWeek])

  const byWeek = useMemo(() => new Map((reports.data ?? []).map((report) => [report.week, report])), [reports.data])

  const create = useMutation({
    mutationFn: (week: string) => api.createReport(week, timeZone),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REPORTS_KEY }),
    onError: () => toast.error(t('reports.createFailed')),
  })
  const remove = useMutation({
    mutationFn: api.deleteReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REPORTS_KEY }),
    onError: () => toast.error(t('reports.deleteFailed')),
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
        <p className="text-sm text-muted-foreground">{t('reports.hint')}</p>
        {reports.isPending && <p className="text-sm text-muted-foreground">{t('reports.loading')}</p>}
        {reports.isError && <p className="text-sm text-muted-foreground">{t('reports.loadFailed')}</p>}
        {reports.isSuccess && weeks.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('reports.noTasks')}</p>
        )}
        {reports.isSuccess &&
          weeks.map((week) => (
            <WeekReport
              key={week}
              week={week}
              current={week === currentWeek}
              report={byWeek.get(week)}
              creating={create.isPending && create.variables === week}
              onCreate={() => create.mutate(week)}
              onDelete={() => remove.mutate(week)}
            />
          ))}
      </div>
    </div>
  )
}

type WeekReportProps = {
  week: string
  current: boolean
  report: Report | undefined
  creating: boolean
  onCreate: () => void
  onDelete: () => void
}

function WeekReport({ week, current, report, creating, onCreate, onDelete }: WeekReportProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <article aria-label={weekLabel(week)} className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-medium">{weekLabel(week)}</h2>
        {current && <Badge variant="secondary">{t('reports.currentWeek')}</Badge>}
        <div className="ml-auto flex gap-1">
          {report ? (
            <>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t('reports.redo')}
                disabled={creating}
                onClick={onCreate}
              >
                {creating ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t('reports.delete')}
                onClick={() => setConfirming(true)}
              >
                <Trash2 />
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" disabled={creating} onClick={onCreate}>
              {creating ? <Loader2 className="animate-spin" /> : <BarChart3 />}
              {t('reports.create')}
            </Button>
          )}
        </div>
      </header>

      {report && <ReportBody stats={report.stats} week={week} />}
      {report && (
        <p className="text-xs text-muted-foreground">
          {t('reports.createdAt', {
            date: createdFormat.format(new Date(report.createdAt)),
          })}
          {current && ` · ${t('reports.weekGoesOn')}`}
        </p>
      )}

      {confirming && (
        <ConfirmDelete
          title={t('reports.confirmDelete')}
          description={t('reports.confirmDeleteText')}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false)
            onDelete()
          }}
        />
      )}
    </article>
  )
}

function ReportBody({ stats, week }: { stats: ReportStats; week: string }) {
  const delta = stats.completed - stats.previousCompleted
  const withDue = stats.onTime + stats.late

  return (
    <>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Tile label={t('reports.completed')} value={String(stats.completed)}>
          {delta !== 0 && (
            <span
              className={cn(
                'flex items-center gap-1',
                delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
              )}
            >
              {delta > 0 ? (
                <TrendingUp className="size-3" aria-hidden />
              ) : (
                <TrendingDown className="size-3" aria-hidden />
              )}
              {t('reports.vsPrevious', {
                count: Math.abs(delta),
                sign: delta > 0 ? '+' : '−',
              })}
            </span>
          )}
          {delta === 0 && <span>{t('reports.sameAsPrevious')}</span>}
        </Tile>
        <Tile label={t('reports.created')} value={String(stats.created)} />
        <Tile label={t('reports.onTime')} value={withDue > 0 ? `${stats.onTime}/${withDue}` : '—'}>
          {withDue > 0 && stats.late > 0 && <span>{t('reports.late', { count: stats.late })}</span>}
          {withDue === 0 && <span>{t('reports.noDue')}</span>}
        </Tile>
        <Tile
          label={t('reports.averageTime')}
          value={stats.averageHours === null ? '—' : formatDuration(stats.averageHours)}
        >
          <span>{t('reports.averageHint')}</span>
        </Tile>
        <Tile label={t('reports.overdueOpen')} value={String(stats.overdueOpen)}>
          <span>{t('reports.overdueHint')}</span>
        </Tile>
      </dl>

      {stats.completed === 0 ? (
        <p className="text-sm text-muted-foreground">{t('reports.nothingDone')}</p>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <DayChart byDay={stats.byDay} week={week} />
            <div className="flex flex-col gap-6">
              <Breakdown
                title={t('reports.byCategory')}
                rows={stats.byCategory.map(({ name, count }) => ({
                  key: name,
                  label: name || t('tasks.noCategory'),
                  count,
                }))}
              />
              <Breakdown
                title={t('reports.byPriority')}
                rows={stats.byPriority.map(({ name, count }) => ({
                  key: name,
                  label: PRIORITY_LABELS[name as Priority],
                  icon: name === 'none' ? undefined : PRIORITY_ICONS[name as Exclude<Priority, 'none'>],
                  count,
                }))}
              />
            </div>
          </div>

          <details className="group">
            <summary className="cursor-pointer text-sm font-medium">
              {t('reports.doneList', { count: stats.completed })}
            </summary>
            <ul className="mt-2 flex flex-col divide-y text-sm">
              {stats.tasks.map((task, index) => (
                <li key={index} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <span className="min-w-0 flex-1 break-words">{task.title}</span>
                  {task.category && <span className="text-xs text-muted-foreground">{task.category}</span>}
                  {task.late && <Badge variant="outline">{t('reports.lateBadge')}</Badge>}
                  <span className="text-xs text-muted-foreground">{doneFormat.format(new Date(task.completedAt))}</span>
                </li>
              ))}
            </ul>
            {stats.tasks.length < stats.completed && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t('reports.listCut', { count: stats.tasks.length })}
              </p>
            )}
          </details>
        </>
      )}
    </>
  )
}

function Tile({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
      {children && <dd className="text-xs text-muted-foreground">{children}</dd>}
    </div>
  )
}

const CHART_HEIGHT = 112

// Finished tasks for each day. One series, so no legend: the heading names it.
function DayChart({ byDay, week }: { byDay: number[]; week: string }) {
  const most = Math.max(...byDay, 1)
  const monday = parseLocalDate(week)

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{t('reports.byDay')}</h3>
      <div role="list" className="flex items-end gap-1 border-b" style={{ height: CHART_HEIGHT + 20 }}>
        {byDay.map((count, index) => {
          const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index)
          const label = `${dayFormat.format(day)}: ${count}`
          return (
            <div
              key={index}
              role="listitem"
              aria-label={label}
              title={label}
              className="group flex flex-1 flex-col items-center justify-end gap-1"
            >
              {count > 0 && <span className="text-xs text-muted-foreground tabular-nums">{count}</span>}
              <div
                className="w-full max-w-6 rounded-t-[4px] bg-foreground/75 transition-colors group-hover:bg-foreground"
                style={{
                  height: count > 0 ? Math.max((count / most) * CHART_HEIGHT, 4) : 0,
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1" aria-hidden>
        {byDay.map((_, index) => (
          <span key={index} className="flex-1 text-center text-xs text-muted-foreground">
            {dayFormat.format(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index))}
          </span>
        ))}
      </div>
    </section>
  )
}

type BreakdownRow = {
  key: string
  label: string
  icon?: {
    icon: React.ComponentType<{ className?: string }>
    className: string
  }
  count: number
}

function Breakdown({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  const most = Math.max(...rows.map((row) => row.count), 1)

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      <ul className="flex flex-col gap-1.5">
        {rows.map(({ key, label, icon, count }) => (
          <li key={key} className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-1.5">
              {icon && <icon.icon className={cn('size-3.5 shrink-0', icon.className)} />}
              <span className="truncate">{label}</span>
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-foreground/75"
                style={{ width: `${(count / most) * 100}%` }}
              />
            </span>
            <span className="text-right text-xs text-muted-foreground tabular-nums">{count}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
