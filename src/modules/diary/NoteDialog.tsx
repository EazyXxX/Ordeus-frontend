import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ImagePlus, Loader2, SpellCheck, Undo2, X } from 'lucide-react'
import { toast } from 'sonner'

import { t } from '@/i18n'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { hasTouchScreen } from '@/lib/utils'
import * as api from './api'
import { LIBRARY_KEY, type Folder, type ImageChanges, type Note, type NoteInput, type NoteRef, type NoteText } from './api'
import { FolderPicker, TagPicker } from './NoteLabels'
import { ImageViewer } from './ImageViewer'
import { imageUrl, isImage, MAX_NOTE_IMAGES } from './images'

// A daily note starts with its full date, the way the server titles the ones
// from zen, so that days and years stand out on the graph.
function dailyTitle(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}.${month}.${year} — `
}

type NoteDialogProps = {
  note: Note | null
  // Prefills the day of a new note.
  defaultDailyDate?: string
  folders: Folder[]
  allNotes: Note[]
  onClose: () => void
  onSave: (input: NoteInput, images: ImageChanges) => void
  onDelete: () => void
}

export function NoteDialog({ note, defaultDailyDate = '', folders, allNotes, onClose, onSave, onDelete }: NoteDialogProps) {
  const [title, setTitle] = useState(note?.title ?? (defaultDailyDate ? dailyTitle(defaultDailyDate) : ''))
  const [body, setBody] = useState(note?.body ?? '')
  const [folder, setFolder] = useState(note?.folder ?? '')
  const [tags, setTags] = useState(note?.tags ?? [])
  const [tagDraft, setTagDraft] = useState('')
  const knownTags = useQuery({ queryKey: [...LIBRARY_KEY, 'tags'], queryFn: api.fetchTags })
  const [links, setLinks] = useState<NoteRef[]>(note?.links ?? [])
  const [dailyDate, setDailyDate] = useState(note ? (note.dailyDate ?? '') : defaultDailyDate)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  // Pictures change only when the note is saved, like the rest of it.
  const [removedImages, setRemovedImages] = useState<string[]>([])
  const [addedImages, setAddedImages] = useState<File[]>([])
  const [viewing, setViewing] = useState<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const addedUrls = useMemo(() => addedImages.map((file) => URL.createObjectURL(file)), [addedImages])
  useEffect(() => () => addedUrls.forEach((url) => URL.revokeObjectURL(url)), [addedUrls])

  const keptImages = (note?.images ?? []).filter((id) => !removedImages.includes(id))
  const imageTiles = [
    ...keptImages.map((id) => ({ key: id, url: imageUrl(id), remove: () => setRemovedImages([...removedImages, id]) })),
    ...addedImages.map((file, index) => ({
      key: addedUrls[index],
      url: addedUrls[index],
      remove: () => setAddedImages(addedImages.filter((other) => other !== file)),
    })),
  ]
  const roomForImages = MAX_NOTE_IMAGES - imageTiles.length

  function addImages(files: File[]) {
    const images = files.filter(isImage)
    if (images.length < files.length) toast.error(t('note.notImage'))
    if (images.length > roomForImages) toast.error(t('note.imagesLimit', { count: MAX_NOTE_IMAGES }))
    if (roomForImages > 0) setAddedImages([...addedImages, ...images.slice(0, roomForImages)])
  }

  function pasteImages(event: ClipboardEvent) {
    const files = [...event.clipboardData.files]
    if (files.some(isImage)) {
      event.preventDefault()
      addImages(files)
    }
  }

  function dropImages(event: DragEvent) {
    const files = [...event.dataTransfer.files]
    if (files.length === 0) return
    event.preventDefault()
    addImages(files)
  }

  // Both versions of the last correction, until the author edits the result.
  const [corrected, setCorrected] = useState<{ before: NoteText; after: NoteText } | null>(null)

  // Closing the note stops the model, which may have a long text to go through.
  const stopProofreading = useRef<AbortController | null>(null)
  useEffect(() => () => stopProofreading.current?.abort(), [])

  const proofread = useMutation({
    mutationFn: () => {
      stopProofreading.current = new AbortController()
      return api.proofreadNote({ title, body }, stopProofreading.current.signal)
    },
    onSuccess: (after) => {
      if (after.title === title && after.body === body) {
        toast.success(t('note.noMistakes'))
        return
      }
      setCorrected({ before: { title, body }, after })
      setTitle(after.title)
      setBody(after.body)
    },
    onError: () => {
      if (!stopProofreading.current?.signal.aborted) toast.error(t('note.proofreadFailed'))
    },
  })
  const canUndo = corrected?.after.title === title && corrected.after.body === body

  function undoCorrection() {
    if (!corrected) return
    setTitle(corrected.before.title)
    setBody(corrected.before.body)
    setCorrected(null)
  }

  const linkOptions = allNotes.filter(
    (other) => other.id !== note?.id && !links.some((link) => link.id === other.id),
  )

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    onSave({
      title,
      body,
      folder,
      // A tag still being typed counts, as if Enter had been pressed.
      tags: [...tags, tagDraft.trim()].filter(Boolean),
      linkIds: links.map((link) => link.id),
      dailyDate: dailyDate || null,
    }, { added: addedImages, removed: removedImages })
    onClose()
  }

  function addLink(id: string) {
    const other = allNotes.find((candidate) => candidate.id === id)
    if (other) setLinks([...links, { id: other.id, title: other.title }])
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex h-[90svh] max-h-[90svh] w-full flex-col overflow-hidden sm:max-w-5xl max-sm:h-dvh max-sm:max-h-dvh max-sm:max-w-full max-sm:rounded-none"
        onOpenAutoFocus={(event) => note && hasTouchScreen() && event.preventDefault()}
        onDragOver={(event) => event.dataTransfer.types.includes('Files') && event.preventDefault()}
        onDrop={dropImages}
      >
        <form onSubmit={submit} className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <DialogHeader>
            <DialogTitle>{note ? t('common.noteButton') : t('zen.newNote')}</DialogTitle>
            <DialogDescription className="sr-only">{t('note.hint')}</DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 grid-rows-[minmax(16rem,1fr)_auto] gap-4 overflow-y-auto md:grid-cols-[minmax(0,1fr)_16rem] md:grid-rows-1 md:overflow-hidden">
            <div className="flex min-h-0 min-w-0 flex-col gap-3">
              <Input
                aria-label={t('note.heading')}
                placeholder={t('note.heading')}
                maxLength={200}
                readOnly={proofread.isPending}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <Textarea
                aria-label={t('common.text')}
                placeholder={t('common.text')}
                className="min-h-0 flex-1 resize-none field-sizing-fixed break-words"
                maxLength={50_000}
                readOnly={proofread.isPending}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                onPaste={pasteImages}
              />

              <div className="flex shrink-0 flex-col gap-1.5">
                <div role="list" aria-label={t('note.images')} className="flex gap-2 overflow-x-auto pb-1">
                  {imageTiles.map((tile, index) => (
                    <div key={tile.key} role="listitem" className="group relative size-20 shrink-0">
                      <button
                        type="button"
                        aria-label={t('note.openImage', { index: index + 1 })}
                        onClick={() => setViewing(index)}
                        className="size-full overflow-hidden rounded-md border outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <img src={tile.url} alt="" loading="lazy" className="size-full object-cover" />
                      </button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon-xs"
                        aria-label={t('note.removeImage', { index: index + 1 })}
                        onClick={tile.remove}
                        className="absolute top-1 right-1 opacity-90 shadow-sm pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-visible:opacity-100"
                      >
                        <X />
                      </Button>
                    </div>
                  ))}
                  {roomForImages > 0 && (
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs text-muted-foreground outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ImagePlus className="size-5" aria-hidden />
                      {t('note.addImages')}
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('note.imagesHint', { count: imageTiles.length, max: MAX_NOTE_IMAGES })}
                </p>
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
              </div>
            </div>

            <aside className="flex min-w-0 flex-col gap-3 md:overflow-y-auto">
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                {t('note.journalDay')}
                <Input type="date" value={dailyDate} onChange={(event) => setDailyDate(event.target.value)} />
              </label>
              <FolderPicker folders={folders} value={folder} onChange={setFolder} />
              <TagPicker
                tags={knownTags.data ?? []}
                value={tags}
                draft={tagDraft}
                onDraftChange={setTagDraft}
                onChange={setTags}
              />

              <div className="flex min-w-0 flex-col gap-2">
                <p className="text-sm font-medium">{t('note.linked')}</p>
                {links.map((link) => (
                  <div key={link.id} className="flex min-w-0 items-center gap-2 rounded-md bg-muted/60 py-1 pr-1 pl-2.5 text-sm">
                    <span className="min-w-0 flex-1 truncate">{link.title}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={t('note.removeLink', { name: link.title })}
                      onClick={() => setLinks(links.filter((other) => other.id !== link.id))}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
                <select
                  aria-label={t('note.addLink')}
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-sm text-muted-foreground"
                  value=""
                  onChange={(event) => addLink(event.target.value)}
                >
                  <option value="">{t('note.addLinkOption')}</option>
                  {linkOptions.map((other) => (
                    <option key={other.id} value={other.id}>
                      {other.title}
                    </option>
                  ))}
                </select>
              </div>
            </aside>
          </div>

          <DialogFooter className="sm:justify-between">
            {note ? (
              <Button type="button" variant="destructive" onClick={() => setConfirmingDelete(true)}>
                {t('common.delete')}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {canUndo ? (
                <Button type="button" variant="outline" onClick={undoCorrection}>
                  <Undo2 />
                  {t('note.undoProofread')}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={proofread.isPending || !(title + body).trim()}
                  onClick={() => proofread.mutate()}
                >
                  {proofread.isPending ? <Loader2 className="animate-spin" /> : <SpellCheck />}
                  {proofread.isPending ? t('note.proofreading') : t('note.proofread')}
                </Button>
              )}
              <Button type="submit" disabled={!title.trim() || proofread.isPending}>
                {t('common.save')}
              </Button>
            </div>
          </DialogFooter>
        </form>

        {viewing !== null && (
          <ImageViewer urls={imageTiles.map((tile) => tile.url)} start={viewing} onClose={() => setViewing(null)} />
        )}

        <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('note.deleteNote')}</AlertDialogTitle>
              <AlertDialogDescription>{t('common.cannotUndo')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onDelete}>
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
