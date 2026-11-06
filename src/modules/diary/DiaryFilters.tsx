import { useState, type FormEvent } from 'react'
import { CalendarDays, MoreHorizontal, type LucideIcon } from 'lucide-react'

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
            <DialogTitle>Переименовать папку</DialogTitle>
            <DialogDescription className="sr-only">Новое название папки</DialogDescription>
          </DialogHeader>
          <Input aria-label="Название папки" maxLength={200} value={name} onChange={(event) => setName(event.target.value)} />
          <DialogFooter>
            <Button type="submit" disabled={!name.trim()}>
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// The diary is a folder of its own: it has dates instead of folders and tags.
const OUTSIDE_DIARY = { daily: undefined, from: undefined, to: undefined }

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
      title: `Удалить папку «${folder.name}»?`,
      description: `Записи останутся в дневнике, но без папки: ${folder.notes}. Отменить это нельзя.`,
      confirm: () => {
        onDeleteFolder(folder.id)
        if (filter.folder === folder.id) onChange({ ...filter, folder: undefined })
      },
    })
  }

  function requestTagDelete(tag: Tag) {
    setPendingDelete({
      title: `Удалить тег «${tag.name}»?`,
      description: `Записи останутся, но тег исчезнет из них: ${tag.notes}. Отменить это нельзя.`,
      confirm: () => {
        onDeleteTag(tag.id)
        if (filter.tag === tag.name) onChange({ ...filter, tag: undefined })
      },
    })
  }

  return (
    <aside className="flex shrink-0 gap-1 overflow-x-auto border-b p-2 [scrollbar-width:none] md:w-56 md:flex-col md:overflow-x-visible md:overflow-y-auto md:border-r md:border-b-0">
      <FilterButton
        label="Все записи"
        active={!filter.folder && !filter.tag && !filter.daily}
        onClick={() => onChange({})}
      />

      <h2 className="hidden px-2 pt-3 pb-1 text-xs font-medium text-muted-foreground md:block">Папки</h2>
      <FilterButton
        label="Ежедневник"
        icon={CalendarDays}
        active={Boolean(filter.daily)}
        onClick={() => onChange({ daily: 'true', from: filter.from, to: filter.to })}
      />
      {folders.map((folder) => (
        <div key={folder.id} className="group flex shrink-0 items-center md:shrink">
          <FilterButton
            label={folder.name}
            mark={folder}
            count={folder.notes}
            active={filter.folder === folder.id}
            onClick={() => onChange({ ...filter, ...OUTSIDE_DIARY, folder: folder.id })}
          />
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Действия с папкой ${folder.name}`}
                className={menuButtonClass}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRenaming(folder)}>Переименовать</DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  setEmojiTarget({
                    name: folder.name,
                    emoji: folder.emoji,
                    save: (emoji) => onFolderEmoji(folder.id, emoji),
                  })
                }
              >
                Эмодзи
              </DropdownMenuItem>
              <ColorSubmenu value={folder.color} onChange={(color) => onFolderColor(folder.id, color)} />
              <DropdownMenuItem variant="destructive" onSelect={() => requestFolderDelete(folder)}>
                Удалить папку
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      {tags.length > 0 && (
        <h2 className="hidden px-2 pt-3 pb-1 text-xs font-medium text-muted-foreground md:block">Теги</h2>
      )}
      {tags.map((tag) => (
        <div key={tag.id} className="group flex shrink-0 items-center md:shrink">
          <FilterButton
            label={`#${tag.name}`}
            mark={tag}
            count={tag.notes}
            active={filter.tag === tag.name}
            onClick={() => onChange({ ...filter, ...OUTSIDE_DIARY, tag: tag.name })}
          />
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label={`Действия с тегом ${tag.name}`} className={menuButtonClass}>
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
                Эмодзи
              </DropdownMenuItem>
              <ColorSubmenu value={tag.color} onChange={(color) => onTagColor(tag.id, color)} />
              <DropdownMenuItem variant="destructive" onSelect={() => requestTagDelete(tag)}>
                Удалить тег
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
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={pendingDelete?.confirm}>
              Удалить
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
