import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { localDate } from '@/lib/dates'

const PRESETS = [
  { label: '7 дней', days: 7 },
  { label: '30 дней', days: 30 },
]

function lastDays(days: number) {
  const today = new Date()
  const first = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days + 1)
  return { from: localDate(first), to: localDate(today) }
}

type DailyRangeProps = {
  from?: string
  to?: string
  onChange: (range: { from?: string; to?: string }) => void
}

export function DailyRange({ from, to, onChange }: DailyRangeProps) {
  return (
    <div role="group" aria-label="Период" className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        с
        <Input
          type="date"
          className="w-auto"
          max={to}
          value={from ?? ''}
          onChange={(event) => onChange({ from: event.target.value || undefined, to })}
        />
      </label>
      <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        по
        <Input
          type="date"
          className="w-auto"
          min={from}
          value={to ?? ''}
          onChange={(event) => onChange({ from, to: event.target.value || undefined })}
        />
      </label>
      {PRESETS.map(({ label, days }) => {
        const range = lastDays(days)
        return (
          <Button
            key={days}
            variant={range.from === from && range.to === to ? 'secondary' : 'ghost'}
            size="sm"
            aria-pressed={range.from === from && range.to === to}
            onClick={() => onChange(range)}
          >
            {label}
          </Button>
        )
      })}
      {(from || to) && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ from: undefined, to: undefined })}>
          Сбросить
        </Button>
      )}
    </div>
  )
}
