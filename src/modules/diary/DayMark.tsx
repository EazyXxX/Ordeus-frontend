import { Button } from '@/components/ui/button'
import type { Day } from './api'
import { moodsOf } from './moods'

type DayMarkProps = {
  day: Day | undefined
  onClick: () => void
}

// A day's mood and score, or an invitation to set them.
export function DayMark({ day, onClick }: DayMarkProps) {
  const moods = moodsOf(day)
  const marked = moods.length > 0 || day?.score

  return (
    <Button variant="ghost" size="xs" onClick={onClick} className="shrink-0 gap-1.5 text-muted-foreground">
      {!marked && 'Оценить день'}
      {moods.length > 0 && (
        <span role="img" aria-label={moods.map((mood) => mood.label).join(', ')} className="text-sm">
          {moods.map((mood) => mood.emoji).join('')}
        </span>
      )}
      {day?.score && <span className="tabular-nums">{day.score}/10</span>}
    </Button>
  )
}
