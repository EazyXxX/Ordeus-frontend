import { useState, type FormEvent } from 'react'
import { CalendarDays, MoreHorizontal, type LucideIcon } from 'lucide-react'

import { t } from '@/i18n'
import { ColorSubmenu } from '@/components/ColorSubmenu'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import type { Color } from '@/lib/colors'
import { cn } from '@/lib/utils'
import type { Folder, Mark, NoteFilter, Tag } from './api'
import { EmojiDialog } from './EmojiDialog'
import { LabelMark } from './LabelMark'

// Always visible on touch screens, which have no hover.
const menuButtonClass =
  'flex shrink-0 pointer-fine:hidden pointer-fine:group-focus-within:flex pointer-fine:group-hover:flex pointer-fine:data-[state=open]:flex'

type FilterButtonProps = {
  label: string
  icon?: LucideIcon
  mark?: Mark
  count?: number
  active: boolean
  onClick: () => void
}

function FilterButton({ label, icon: Icon, mark, count, active, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex min-w-0 shrink-0 items-center gap-2 rounded-md px-2 py-1 text-left max-md:py-2 text-sm whitespace-nowrap outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring md:w-full md:shrink',
        active && 'bg-muted font-medium',
      )}
    >
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
      <LabelMark mark={mark} />
      <span className="truncate">{label}</span>
      {count !== undefined && <span className="ml-auto text-xs text-muted-foreground">{count}</span>}
    </button>
  )
}

type RenameDialogProps = {
  folder: Folder
  onClose: () => void
  onRename: (name: string) => void
}

function RenameDialog({ folder, onClose, onRename }: RenameDialogProps) {
  const [name, setName] = useState(folder.name)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    onRename(name.trim())
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t('folders.rename')}</DialogTitle>
            <DialogDescription className="sr-only">{t('folders.newName')}</DialogDescription>
          </DialogHeader>
          <Input aria-label={t('folders.name')} maxLength={200} value={name} onChange={(event) => setName(event.target.value)} />
          <DialogFooter>
            <Button type="submit" disabled={!name.trim()}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type EmojiTarget = {
  name: string
  emoji: string
  save: (emoji: string) => void
}

type PendingDelete = {
  title: string
  description: string
  confirm: () => void
}

type DiaryFiltersProps = {
  folders: Folder[]
  tags: Tag[]
  filter: NoteFilter
  onChange: (filter: NoteFilter) => void
  onRenameFolder: (id: string, name: string) => void
  onFolderColor: (id: string, color: Color) => void
  onFolderEmoji: (id: string, emoji: string) => void
  onDeleteFolder: (id: string) => void
  onTagColor: (id: string, color: Color) => void
  onTagEmoji: (id: string, emoji: string) => void
  onDeleteTag: (id: string) => void
}

export function DiaryFilters({
  folders,
  tags,
  filter,
  onChange,
  onRenameFolder,
  onFolderColor,
  onFolderEmoji,
  onDeleteFolder,
  onTagColor,
  onTagEmoji,
  onDeleteTag,
}: DiaryFiltersProps) {
  const [renaming, setRenaming] = useState<Folder | null>(null)
  const [emojiTarget, setEmojiTarget] = useState<EmojiTarget | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)

  function requestFolderDelete(folder: Folder) {
    setPendingDelete({
      title: t('folders.confirmDelete', { name: folder.name }),
      description: t('folders.confirmDeleteText', { count: folder.notes }),
      confirm: () => {
        onDeleteFolder(folder.id)
        if (filter.folder === folder.id) onChange({ ...filter, folder: undefined })
      },
    })
  }

  function requestTagDelete(tag: Tag) {
    setPendingDelete({
      title: t('folders.confirmTag', { name: tag.name }),
      description: t('folders.confirmTagText', { count: tag.notes }),
      confirm: () => {
        onDeleteTag(tag.id)
        if (filter.tag === tag.name) onChange({ ...filter, tag: undefined })
      },
    })
  }

  return (
    <aside className="flex shrink-0 gap-1 overflow-x-auto border-b p-2 [scrollbar-width:none] md:w-56 md:flex-col md:overflow-x-visible md:overflow-y-auto md:border-r md:border-b-0">
      <FilterButton
        label={t('folders.all')}
        active={!filter.folder && !filter.tag && !filter.daily}
        onClick={() => onChange({})}
      />

      <h2 className="hidden px-2 pt-3 pb-1 text-xs font-medium text-muted-foreground md:block">{t('diary.folders')}</h2>
      <FilterButton
        label={t('folders.daily')}
        icon={CalendarDays}
        active={Boolean(filter.daily)}
        onClick={() => onChange({ daily: 'true' })}
      />
      {folders.map((folder) => (
        <div key={folder.id} className="group flex shrink-0 items-center md:shrink">
          <FilterButton
            label={folder.name}
            mark={folder}
            count={folder.notes}
            active={filter.folder === folder.id}
            onClick={() => onChange({ ...filter, daily: undefined, folder: folder.id })}
          />
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t('folders.actions', { name: folder.name })}
                className={menuButtonClass}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRenaming(folder)}>{t('common.rename')}</DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  setEmojiTarget({
                    name: folder.name,
                    emoji: folder.emoji,
                    save: (emoji) => onFolderEmoji(folder.id, emoji),
                  })
                }
              >
                {t('common.emoji')}
              </DropdownMenuItem>
              <ColorSubmenu value={folder.color} onChange={(color) => onFolderColor(folder.id, color)} />
              <DropdownMenuItem variant="destructive" onSelect={() => requestFolderDelete(folder)}>
                {t('folders.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      {tags.length > 0 && (
        <h2 className="hidden px-2 pt-3 pb-1 text-xs font-medium text-muted-foreground md:block">{t('diary.tags')}</h2>
      )}
      {tags.map((tag) => (
        <div key={tag.id} className="group flex shrink-0 items-center md:shrink">
          <FilterButton
            label={`#${tag.name}`}
            mark={tag}
            count={tag.notes}
            active={filter.tag === tag.name}
            onClick={() => onChange({ ...filter, daily: undefined, tag: tag.name })}
          />
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label={t('folders.tagActions', { name: tag.name })} className={menuButtonClass}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() =>
                  setEmojiTarget({
                    name: `#${tag.name}`,
                    emoji: tag.emoji,
                    save: (emoji) => onTagEmoji(tag.id, emoji),
                  })
                }
              >
                {t('common.emoji')}
              </DropdownMenuItem>
              <ColorSubmenu value={tag.color} onChange={(color) => onTagColor(tag.id, color)} />
              <DropdownMenuItem variant="destructive" onSelect={() => requestTagDelete(tag)}>
                {t('folders.deleteTag')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingDelete?.title}</AlertDialogTitle>
            <AlertDialogDescription>{pendingDelete?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={pendingDelete?.confirm}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {emojiTarget && (
        <EmojiDialog
          name={emojiTarget.name}
          emoji={emojiTarget.emoji}
          onClose={() => setEmojiTarget(null)}
          onSave={emojiTarget.save}
        />
      )}

      {renaming && (
        <RenameDialog
          folder={renaming}
          onClose={() => setRenaming(null)}
          onRename={(name) => onRenameFolder(renaming.id, name)}
        />
      )}
    </aside>
  )
}
