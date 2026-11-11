import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowUp, ImagePlus, Loader2, Mic, Sparkles, Square, X } from 'lucide-react'
import { toast } from 'sonner'

import { t } from '@/i18n'
import { useCurrentUser } from '@/app/account/session'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ModelSelector } from './ModelSelector'
import { VoiceWaveform } from './VoiceWaveform'
import { useVoiceInput } from './useVoiceInput'

// Kept per account, so a draft never shows up after switching accounts.
const draftKey = (section: string, userId: string) => `ordeus.${section}.zen-draft.${userId}`
const MAX_TEXT_LENGTH = 50_000

const firstName = (name: string) => name.trim().split(/\s+/)[0]

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function readDraft(key: string) {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function writeDraft(key: string, text: string) {
  try {
    localStorage.setItem(key, text)
  } catch {
    // The draft is a convenience: writing works without it.
  }
}

type ZenComposerProps = {
  // Separates the drafts of different sections.
  section: string
  heading: (firstName: string) => string
  placeholder: string
  idleStatus: string
  activeStatus: (active: number) => string
  acceptedTitle: string
  acceptedDescription: string
  active: number
  // How many pictures a capture may carry. Without it the composer takes none.
  maxImages?: number
  onSubmit: (text: string, images: File[]) => Promise<unknown>
  onSent: () => void
}

export function ZenComposer({
  section,
  heading,
  placeholder,
  idleStatus,
  activeStatus,
  acceptedTitle,
  acceptedDescription,
  active,
  maxImages = 0,
  onSubmit,
  onSent,
}: ZenComposerProps) {
  const textarea = useRef<HTMLTextAreaElement>(null)
  const user = useCurrentUser()
  const key = draftKey(section, user.id)
  const [text, setText] = useState(() => readDraft(key))
  const textValue = useRef(text)
  // Pictures are not part of the saved draft: they would not fit in storage.
  const [images, setImages] = useState<File[]>([])
  const fileInput = useRef<HTMLInputElement>(null)
  const imageUrls = useMemo(() => images.map((file) => URL.createObjectURL(file)), [images])
  useEffect(() => () => imageUrls.forEach((url) => URL.revokeObjectURL(url)), [imageUrls])

  function addImages(files: File[]) {
    const pictures = files.filter((file) => file.type.startsWith('image/'))
    if (pictures.length < files.length) toast.error(t('note.notImage'))
    const room = maxImages - images.length
    if (pictures.length > room) toast.error(t('note.imagesLimit', { count: maxImages }))
    if (room > 0) setImages([...images, ...pictures.slice(0, room)])
    if (isSuccess || isError) reset()
  }

  function pasteImages(event: ClipboardEvent) {
    const files = [...event.clipboardData.files]
    if (maxImages > 0 && files.some((file) => file.type.startsWith('image/'))) {
      event.preventDefault()
      addImages(files)
    }
  }

  function dropImages(event: DragEvent) {
    const files = [...event.dataTransfer.files]
    if (maxImages === 0 || files.length === 0) return
    event.preventDefault()
    addImages(files)
  }

  const { mutate: submit, isPending, isError, isSuccess, reset } = useMutation({
    mutationFn: ({ value, pictures }: { value: string; pictures: File[] }) => onSubmit(value, pictures),
    onSuccess: () => {
      textValue.current = ''
      setText('')
      setImages([])
      writeDraft(key, '')
      textarea.current?.focus()
      toast.success(acceptedTitle, { description: acceptedDescription })
      onSent()
    },
    onError: () => {
      toast.error(t('zen.saveFailedTitle'), { description: t('zen.saveFailedText') })
    },
  })

  function change(value: string) {
    textValue.current = value
    setText(value)
    writeDraft(key, value)
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
    if ((value || images.length > 0) && !isPending) submit({ value, pictures: images })
  }

  function statusText() {
    if (voice.status === 'recording') return t('zen.recording', { time: formatDuration(voice.seconds) })
    if (voice.status === 'transcribing') return t('zen.transcribing')
    if (voice.error) return voice.error
    if (isError) return t('zen.saveFailedStatus')
    if (active > 0) return activeStatus(active)
    if (isSuccess) return t('common.saved')
    return idleStatus
  }

  const recording = voice.status === 'recording'
  const transcribing = voice.status === 'transcribing'

  return (
    // The empty third row centers the card itself. The extra bottom padding equals
    // the app header plus the mode tabs, so the card sits mid-screen, not mid-area.
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[1fr_auto_1fr] justify-items-center gap-6 overflow-y-auto px-4 pt-4 pb-[calc(1rem+101px)]">
      <h2 className="self-end text-center text-2xl font-medium">{heading(firstName(user.name))}</h2>

      <div
        onClick={() => textarea.current?.focus()}
        onDragOver={(event) => maxImages > 0 && event.dataTransfer.types.includes('Files') && event.preventDefault()}
        onDrop={dropImages}
        className="flex w-full max-w-2xl cursor-text flex-col rounded-2xl border bg-card shadow-sm transition-shadow focus-within:border-ring focus-within:shadow-md"
      >
        <textarea
          ref={textarea}
          autoFocus
          aria-label={t('zen.newNote')}
          placeholder={placeholder}
          maxLength={MAX_TEXT_LENGTH}
          value={text}
          onChange={(event) => change(event.target.value)}
          onPaste={pasteImages}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault()
              send()
            }
          }}
          className="field-sizing-content max-h-[55svh] min-h-28 w-full resize-none bg-transparent px-4 pt-4 pb-2 text-base leading-relaxed outline-none placeholder:text-muted-foreground"
        />
        {images.length > 0 && (
          <div role="list" aria-label={t('note.images')} className="flex gap-2 overflow-x-auto px-4 pb-2">
            {images.map((file, index) => (
              <div key={imageUrls[index]} role="listitem" className="relative size-16 shrink-0">
                <img src={imageUrls[index]} alt="" className="size-full rounded-md border object-cover" />
                <Button
                  variant="secondary"
                  size="icon-xs"
                  aria-label={t('note.removeImage', { index: index + 1 })}
                  className="absolute top-0.5 right-0.5 shadow-sm"
                  onClick={(event) => {
                    event.stopPropagation()
                    setImages(images.filter((other) => other !== file))
                  }}
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
        )}
        {voice.stream && (
          <div className="px-4">
            <VoiceWaveform stream={voice.stream} />
          </div>
        )}
        <div className="flex items-center justify-between gap-3 p-2 pl-4">
          <p
            role="status"
            className={cn(
              'flex min-w-0 flex-1 items-center gap-1.5 text-xs',
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
            {maxImages > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg"
                  aria-label={t('zen.addPhotos')}
                  title={t('zen.addPhotos')}
                  disabled={images.length >= maxImages}
                  onClick={(event) => {
                    event.stopPropagation()
                    fileInput.current?.click()
                  }}
                >
                  <ImagePlus />
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(event) => {
                    addImages([...(event.target.files ?? [])])
                    event.target.value = ''
                  }}
                />
              </>
            )}
            <Button
              variant={recording ? 'destructive' : 'ghost'}
              size="icon"
              className="rounded-lg"
              aria-label={recording ? t('zen.stopRecording') : t('zen.record')}
              title={recording ? t('zen.stopRecording') : t('zen.record')}
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
              aria-label={t('zen.saveNote')}
              onClick={send}
              disabled={(!text.trim() && images.length === 0) || isPending}
            >
              <ArrowUp />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
