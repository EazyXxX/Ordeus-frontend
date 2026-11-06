import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { BookOpen, CalendarCheck } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { localDate } from '@/lib/dates'
import * as api from './api'
import { DAYS_KEY } from './api'
import { moodsOf } from './moods'
import { ScoreBars } from './ScoreBars'
import { useDays } from './useDays'

const RETROSPECTIVE_DAYS = 30

function lastDays(count: number) {
  const today = new Date()
  return Array.from({ length: count }, (_, index) =>
    localDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - count + 1 + index)),
  )
}

type DiaryRetrospectiveProps = {
  onOpenDay: (date: string) => void
}

export function DiaryRetrospective({ onOpenDay }: DiaryRetrospectiveProps) {
  const queryClient = useQueryClient()
  const { byDate: days } = useDays()
  const [dates] = useState(() => lastDays(RETROSPECTIVE_DAYS))
  const today = dates[dates.length - 1]
  const yesterday = dates[dates.length - 2]

  // Yesterday is summed up by itself. A day without notes is refused quietly.
  useEffect(() => {
    api
      .requestDaySummary(yesterday, false)
      .then(() => queryClient.invalidateQueries({ queryKey: DAYS_KEY }))
      .catch(() => {})
  }, [yesterday, queryClient])

  const scores = useMemo(() => dates.flatMap((date) => days.get(date)?.score ?? []), [dates, days])
  const average = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null
  const todayMoods = moodsOf(days.get(today))
  const todayScore = days.get(today)?.score

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Последние 30 дней</h2>
          <p className="text-xs text-muted-foreground">
            {average === null
              ? 'Оцените день, и здесь появится ретроспектива'
              : `Средняя оценка ${average.toFixed(1)} из 10, оценено дней: ${scores.length}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenDay(today)}>
            {todayMoods.length > 0 ? <span aria-hidden>{todayMoods.map((mood) => mood.emoji).join('')}</span> : <CalendarCheck />}
            {todayScore ? `Сегодня ${todayScore}/10` : 'Оценить сегодня'}
          </Button>
          <Button asChild>
            <Link to="/diary/book">
              <BookOpen />
              Читать как книгу
            </Link>
          </Button>
        </div>
      </div>
      <ScoreBars dates={dates} days={days} onSelect={onOpenDay} />
    </section>
  )
}
