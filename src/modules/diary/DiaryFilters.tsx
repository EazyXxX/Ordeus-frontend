import { useState, type FormEvent } from 'react'
import { MoreHorizontal } from 'lucide-react'

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
import { COLOR_DOT, type Color } from '@/lib/colors'
import { cn } from '@/lib/utils'
import type { Folder, NoteFilter, Tag } from './api'

// Always visible on touch screens, which have no hover.
const menuButtonClass = 'flex shrink-0 md:hidden md:group-focus-within:flex md:group-hover:flex md:data-[state=open]:flex'

type FilterButtonProps = {
  label: string
  color?: Color
  count?: number
  active: boolean
  onClick: () => void
}

function FilterButton({ label, color, count, active, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex min-w-0 shrink-0 items-center gap-2 rounded-md px-2 py-1 text-left text-sm whitespace-nowrap outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring md:w-full md:shrink',
        active && 'bg-muted font-medium',
      )}
    >
      {color && <span className={cn('size-2.5 shrink-0 rounded-full', COLOR_DOT[color])} aria-hidden />}
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
  onDeleteFolder: (id: string) => void
  onTagColor: (id: string, color: Color) => void
  onDeleteTag: (id: string) => void
}

export function DiaryFilters({
  folders,
  tags,
  filter,
  onChange,
  onRenameFolder,
  onFolderColor,
  onDeleteFolder,
  onTagColor,
  onDeleteTag,
}: DiaryFiltersProps) {
  const [renaming, setRenaming] = useState<Folder | null>(null)
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
    <aside className="flex shrink-0 gap-1 overflow-x-auto border-b p-2 md:w-56 md:flex-col md:overflow-x-visible md:overflow-y-auto md:border-r md:border-b-0">
      <FilterButton
        label="Все записи"
        active={!filter.folder && !filter.tag}
        onClick={() => onChange({ ...filter, folder: undefined, tag: undefined })}
      />

      {folders.length > 0 && (
        <h2 className="hidden px-2 pt-3 pb-1 text-xs font-medium text-muted-foreground md:block">Папки</h2>
      )}
      {folders.map((folder) => (
        <div key={folder.id} className="group flex shrink-0 items-center md:shrink">
          <FilterButton
            label={folder.name}
            color={folder.color}
            count={folder.notes}
            active={filter.folder === folder.id}
            onClick={() => onChange({ ...filter, folder: filter.folder === folder.id ? undefined : folder.id })}
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
            color={tag.color}
            count={tag.notes}
            active={filter.tag === tag.name}
            onClick={() => onChange({ ...filter, tag: filter.tag === tag.name ? undefined : tag.name })}
          />
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label={`Действия с тегом ${tag.name}`} className={menuButtonClass}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
