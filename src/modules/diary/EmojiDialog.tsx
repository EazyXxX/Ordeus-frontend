import { useDeferredValue, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type EmojiEntry = { emoji: string; label: string; group?: number; tags?: string[]; version: number }

// Newer emojis show as empty boxes until the system's font catches up.
const NEWEST_EMOJI_VERSION = 16

// The numbers are emojibase's own groups, in the order they are shown.
const GROUPS = [
  { id: 0, icon: '😀', label: 'Смайлики и эмоции' },
  { id: 1, icon: '👋', label: 'Люди и тело' },
  { id: 3, icon: '🐻', label: 'Животные и природа' },
  { id: 4, icon: '🍎', label: 'Еда и напитки' },
  { id: 5, icon: '✈️', label: 'Путешествия и места' },
  { id: 6, icon: '⚽', label: 'Занятия' },
  { id: 7, icon: '💡', label: 'Предметы' },
  { id: 8, icon: '❤️', label: 'Символы' },
  { id: 9, icon: '🏁', label: 'Флаги' },
]

// About 950 KB, so it loads only when the picker is opened.
async function fetchEmojis() {
  const { default: all } = await import('emojibase-data/ru/data.json')
  const shown = new Set(GROUPS.map((group) => group.id))
  return (all as EmojiEntry[]).filter(
    (entry) => entry.group !== undefined && shown.has(entry.group) && entry.version <= NEWEST_EMOJI_VERSION,
  )
}

function matches({ label, tags = [] }: EmojiEntry, query: string) {
  // From the start of a word, so that "кот" does not find "скотовод".
  return [label, ...tags].some((text) => text.toLowerCase().split(/\s+/).some((word) => word.startsWith(query)))
}

type EmojiDialogProps = {
  name: string
  emoji: string
  onClose: () => void
  onSave: (emoji: string) => void
}

export function EmojiDialog({ name, emoji, onClose, onSave }: EmojiDialogProps) {
  const [group, setGroup] = useState(GROUPS[0].id)
  const [search, setSearch] = useState('')
  const query = useDeferredValue(search.trim().toLowerCase())
  const emojis = useQuery({ queryKey: ['emoji-data'], queryFn: fetchEmojis, staleTime: Infinity })

  const visible = useMemo(() => {
    const all = emojis.data ?? []
    return query ? all.filter((entry) => matches(entry, query)) : all.filter((entry) => entry.group === group)
  }, [emojis.data, group, query])

  function choose(next: string) {
    onSave(next)
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate">Эмодзи: {name}</DialogTitle>
          <DialogDescription>Заменит цветной кружок рядом с названием.</DialogDescription>
        </DialogHeader>

        <Input
          type="search"
          aria-label="Поиск эмодзи"
          placeholder="Поиск: кот, работа, спорт"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {!query && (
          <div role="group" aria-label="Группы эмодзи" className="grid grid-cols-9 gap-0.5">
            {GROUPS.map(({ id, icon, label }) => (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={group === id}
                onClick={() => setGroup(id)}
                className={cn(
                  'flex h-10 items-center justify-center rounded-md text-2xl outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                  group === id && 'bg-muted',
                )}
              >
                {icon}
              </button>
            ))}
          </div>
        )}

        <div className="h-[55svh] overflow-y-auto">
          {emojis.isPending && <p className="text-sm text-muted-foreground">Загружаем эмодзи…</p>}
          {emojis.isError && <p className="text-sm text-muted-foreground">Не удалось загрузить эмодзи.</p>}
          {emojis.data && visible.length === 0 && <p className="text-sm text-muted-foreground">Ничего не найдено.</p>}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-1">
            {visible.map(({ emoji: option, label }) => (
              <button
                key={option}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={option === emoji}
                onClick={() => choose(option)}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-md text-3xl outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                  option === emoji && 'bg-muted',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {emoji && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => choose('')}>
              Убрать эмодзи
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
