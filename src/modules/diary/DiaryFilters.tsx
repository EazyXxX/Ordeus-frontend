import { useState, type FormEvent } from 'react'
import { MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Folder, NoteFilter, Tag } from './api'

type FilterButtonProps = {
  label: string
  count?: number
  active: boolean
  onClick: () => void
}

function FilterButton({ label, count, active, onClick }: FilterButtonProps) {
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

type DiaryFiltersProps = {
  folders: Folder[]
  tags: Tag[]
  filter: NoteFilter
  onChange: (filter: NoteFilter) => void
  onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void
}

export function DiaryFilters({ folders, tags, filter, onChange, onRenameFolder, onDeleteFolder }: DiaryFiltersProps) {
  const [renaming, setRenaming] = useState<Folder | null>(null)

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
                className="hidden shrink-0 group-focus-within:flex group-hover:flex data-[state=open]:flex"
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRenaming(folder)}>Переименовать</DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  onDeleteFolder(folder.id)
                  if (filter.folder === folder.id) onChange({ ...filter, folder: undefined })
                }}
              >
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
        <FilterButton
          key={tag.name}
          label={`#${tag.name}`}
          count={tag.notes}
          active={filter.tag === tag.name}
          onClick={() => onChange({ ...filter, tag: filter.tag === tag.name ? undefined : tag.name })}
        />
      ))}

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
