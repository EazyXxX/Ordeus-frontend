import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowUp, Loader2, Mic, Sparkles, Square } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CAPTURES_KEY, createCapture } from './api'
import { ModelSelector } from './ModelSelector'
import { VoiceWaveform } from './VoiceWaveform'
import { useVoiceInput } from './useVoiceInput'
import { useCaptures } from './useCaptures'

const DRAFT_KEY = 'ordeus.diary.zen-draft'
const MAX_TEXT_LENGTH = 50_000

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

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
  const textValue = useRef(text)

  const { mutate: submit, isPending, isError, isSuccess, reset } = useMutation({
    mutationFn: createCapture,
    onSuccess: () => {
      textValue.current = ''
      setText('')
      writeDraft('')
      textarea.current?.focus()
      void queryClient.invalidateQueries({ queryKey: CAPTURES_KEY })
    },
  })

  function change(value: string) {
    textValue.current = value
    setText(value)
    writeDraft(value)
    if (isSuccess || isError) reset()
  }

  const voice = useVoiceInput((spoken) => {
    const current = textValue.current.trimEnd()
    change(current ? `${current} ${spoken}` : spoken)
    textarea.current?.focus()
  })

  function send() {
    voice.clearError()
    const value = text.trim()
    if (value && !isPending) submit(value)
  }

  function statusText() {
    if (voice.status === 'recording') return `Запись ${formatDuration(voice.seconds)}`
    if (voice.status === 'transcribing') return 'Распознаю речь…'
    if (voice.error) return voice.error
    if (isError) return 'Не удалось сохранить. Текст остался здесь.'
    if (active > 0) return `Раскладываю по полочкам: ${active}`
    if (isSuccess) return 'Сохранено'
    return 'Нейросеть сама разложит по папкам и тегам'
  }

  const recording = voice.status === 'recording'
  const transcribing = voice.status === 'transcribing'

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
        {voice.stream && (
          <div className="px-4">
            <VoiceWaveform stream={voice.stream} />
          </div>
        )}
        <div className="flex items-center justify-between gap-3 p-2 pl-4">
          <p
            role="status"
            className={cn(
              'flex min-w-0 items-center gap-1.5 text-xs',
              isError || voice.error ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {transcribing || active > 0 ? (
              <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
            ) : recording ? (
              <span className="size-2 shrink-0 animate-pulse rounded-full bg-destructive" aria-hidden />
            ) : (
              <Sparkles className="size-3.5 shrink-0" aria-hidden />
            )}
            <span className="truncate" title={statusText()}>{statusText()}</span>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <ModelSelector />
            <span className="hidden text-xs text-muted-foreground md:inline">⌘↵</span>
            <Button
              variant={recording ? 'destructive' : 'ghost'}
              size="icon"
              className="rounded-lg"
              aria-label={recording ? 'Остановить запись' : 'Записать голосом'}
              title={recording ? 'Остановить запись' : 'Записать голосом'}
              disabled={transcribing}
              onClick={(event) => {
                event.stopPropagation()
                if (recording) voice.stop()
                else void voice.start()
              }}
            >
              {transcribing ? <Loader2 className="animate-spin" /> : recording ? <Square /> : <Mic />}
            </Button>
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
