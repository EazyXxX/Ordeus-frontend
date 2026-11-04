import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowUp, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CAPTURES_KEY, createCapture } from './api'
import { ModelSelector } from './ModelSelector'
import { useCaptures } from './useCaptures'

const DRAFT_KEY = 'ordeus.diary.zen-draft'
const MAX_TEXT_LENGTH = 50_000

function readDraft() {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? ''
  } catch {
    return ''
  }
}

function writeDraft(text: string) {
  try {
    localStorage.setItem(DRAFT_KEY, text)
  } catch {
    // The draft is a convenience: writing works without it.
  }
}

export function ZenMode() {
  const queryClient = useQueryClient()
  const textarea = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState(readDraft)
  const { active } = useCaptures()

  const { mutate: submit, isPending, isError, isSuccess, reset } = useMutation({
    mutationFn: createCapture,
    onSuccess: () => {
      setText('')
      writeDraft('')
      textarea.current?.focus()
      void queryClient.invalidateQueries({ queryKey: CAPTURES_KEY })
    },
  })

  function change(value: string) {
    setText(value)
    writeDraft(value)
    if (isSuccess || isError) reset()
  }

  function send() {
    const value = text.trim()
    if (value && !isPending) submit(value)
  }

  const status = isError
    ? 'Не удалось сохранить. Текст остался здесь.'
    : active > 0
      ? `Раскладываю по полочкам: ${active}`
      : isSuccess
        ? 'Сохранено'
        : 'Нейросеть сама разложит по папкам и тегам'

  return (
    // The empty third row centers the card itself. The extra bottom padding equals
    // the app header plus the mode tabs, so the card sits mid-screen, not mid-area.
    <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto_1fr] justify-items-center gap-6 overflow-y-auto px-4 pt-4 pb-[calc(1rem+101px)]">
      <h2 className="self-end text-center text-2xl font-medium">О чём думаешь?</h2>

      <div
        onClick={() => textarea.current?.focus()}
        className="flex w-full max-w-2xl cursor-text flex-col rounded-2xl border bg-card shadow-sm transition-shadow focus-within:border-ring focus-within:shadow-md"
      >
        <textarea
          ref={textarea}
          autoFocus
          aria-label="Новая запись"
          placeholder="Запиши всё, что в голове"
          maxLength={MAX_TEXT_LENGTH}
          value={text}
          onChange={(event) => change(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault()
              send()
            }
          }}
          className="field-sizing-content max-h-[55svh] min-h-28 w-full resize-none bg-transparent px-4 pt-4 pb-2 text-base leading-relaxed outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between gap-3 p-2 pl-4">
          <p
            role="status"
            className={cn(
              'flex min-w-0 items-center gap-1.5 text-xs',
              isError ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            <Sparkles className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{status}</span>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <ModelSelector />
            <span className="hidden text-xs text-muted-foreground md:inline">⌘↵</span>
            <Button
              size="icon"
              className="rounded-lg"
              aria-label="Сохранить запись"
              onClick={send}
              disabled={!text.trim() || isPending}
            >
              <ArrowUp />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
