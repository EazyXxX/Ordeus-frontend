import { useRef, useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { ChecklistItem } from './api'

export type ChecklistRow = ChecklistItem & { key: number }

type ChecklistProps = {
  items: ChecklistRow[]
  onChange: (items: ChecklistRow[]) => void
}

export function Checklist({ items, onChange }: ChecklistProps) {
  const [draft, setDraft] = useState('')
  const nextKey = useRef(items.length)

  const done = items.filter((item) => item.done).length
  const percent = items.length === 0 ? 0 : Math.round((done / items.length) * 100)

  function update(key: number, changes: Partial<ChecklistItem>) {
    onChange(items.map((item) => (item.key === key ? { ...item, ...changes } : item)))
  }

  function add(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const title = draft.trim()
    if (!title) return
    onChange([...items, { key: nextKey.current++, title, done: false }])
    setDraft('')
  }

  return (
    <section aria-label="Чек-лист" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Чек-лист</h3>
        {items.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {done} из {items.length}
          </span>
        )}
      </div>
      {items.length > 0 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${percent}%` }} />
        </div>
      )}
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <Checkbox
            aria-label={`Выполнено: ${item.title}`}
            checked={item.done}
            onCheckedChange={(checked) => update(item.key, { done: checked === true })}
          />
          <Input
            aria-label="Пункт чек-листа"
            className={item.done ? 'h-8 text-muted-foreground line-through' : 'h-8'}
            maxLength={200}
            value={item.title}
            onChange={(event) => update(item.key, { title: event.target.value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Удалить пункт ${item.title}`}
            onClick={() => onChange(items.filter((other) => other.key !== item.key))}
          >
            <X />
          </Button>
        </div>
      ))}
      <Input
        aria-label="Новый пункт"
        className="h-8"
        placeholder="Добавить пункт и нажать Enter"
        maxLength={200}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={add}
      />
    </section>
  )
}
