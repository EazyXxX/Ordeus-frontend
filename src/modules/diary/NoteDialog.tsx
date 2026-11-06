import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'

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
import type { Folder, Note, NoteInput, NoteRef } from './api'

const parseTags = (value: string) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

type NoteDialogProps = {
  note: Note | null
  // Prefills the day of a new note.
  defaultDailyDate?: string
  folders: Folder[]
  allNotes: Note[]
  onClose: () => void
  onSave: (input: NoteInput) => void
  onDelete: () => void
}

export function NoteDialog({ note, defaultDailyDate = '', folders, allNotes, onClose, onSave, onDelete }: NoteDialogProps) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [body, setBody] = useState(note?.body ?? '')
  const [folder, setFolder] = useState(note?.folder ?? '')
  const [tags, setTags] = useState(note?.tags.join(', ') ?? '')
  const [links, setLinks] = useState<NoteRef[]>(note?.links ?? [])
  const [dailyDate, setDailyDate] = useState(note ? (note.dailyDate ?? '') : defaultDailyDate)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

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
      tags: parseTags(tags),
      linkIds: links.map((link) => link.id),
      dailyDate: dailyDate || null,
    })
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
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <Textarea
                aria-label={t('common.text')}
                placeholder={t('common.text')}
                className="min-h-0 flex-1 resize-none field-sizing-fixed break-words"
                maxLength={50_000}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </div>

            <aside className="flex min-w-0 flex-col gap-3 md:overflow-y-auto">
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                {t('note.journalDay')}
                <Input type="date" value={dailyDate} onChange={(event) => setDailyDate(event.target.value)} />
              </label>
              <Input
                aria-label={t('note.folder')}
                placeholder={t('note.folder')}
                list="diary-folders"
                maxLength={200}
                value={folder}
                onChange={(event) => setFolder(event.target.value)}
              />
              <datalist id="diary-folders">
                {folders.map(({ id, name }) => (
                  <option key={id} value={name} />
                ))}
              </datalist>
              <Input
                aria-label={t('note.tags')}
                placeholder={t('note.tags')}
                value={tags}
                onChange={(event) => setTags(event.target.value)}
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
            <Button type="submit" disabled={!title.trim()}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>

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
