import { useState } from 'react'
import { Plus, X } from 'lucide-react'

import { t } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Folder, Tag } from './api'
import { LabelMark } from './LabelMark'

const NEW_FOLDER = '\u0000new'
const SUGGESTED_TAGS = 12

const selectClass = 'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-sm'

type FolderPickerProps = {
  folders: Folder[]
  value: string
  onChange: (folder: string) => void
}

// One of the existing folders, none, or a new one typed by hand.
export function FolderPicker({ folders, value, onChange }: FolderPickerProps) {
  const known = value === '' || folders.some((folder) => folder.name === value)
  const [creating, setCreating] = useState(!known)

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-sm font-medium">{t('note.folderLabel')}</p>
      <select
        aria-label={t('note.folderLabel')}
        className={selectClass}
        value={creating ? NEW_FOLDER : value}
        onChange={(event) => {
          const next = event.target.value
          setCreating(next === NEW_FOLDER)
          onChange(next === NEW_FOLDER ? '' : next)
        }}
      >
        <option value="">{t('note.noFolder')}</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.name}>
            {folder.emoji ? `${folder.emoji} ${folder.name}` : folder.name}
          </option>
        ))}
        <option value={NEW_FOLDER}>{t('note.newFolder')}</option>
      </select>
      {creating && (
        <Input
          autoFocus
          aria-label={t('note.newFolderName')}
          placeholder={t('note.newFolderName')}
          maxLength={200}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  )
}

type TagPickerProps = {
  tags: Tag[]
  value: string[]
  draft: string
  onDraftChange: (draft: string) => void
  onChange: (tags: string[]) => void
}

const cleanTag = (tag: string) => tag.trim().replace(/^#/, '').toLowerCase()

// Chips for the note's tags, a field for a new one and the account's most used
// tags to pick with a click. The field's text counts too when the note is saved.
export function TagPicker({ tags, value, draft, onDraftChange, onChange }: TagPickerProps) {
  const marks = new Map(tags.map((tag) => [tag.name, tag]))
  const query = cleanTag(draft)
  const suggestions = tags
    .filter((tag) => !value.includes(tag.name) && (!query || tag.name.includes(query)))
    .slice(0, SUGGESTED_TAGS)

  function add(raw: string) {
    const added = raw.split(',').map(cleanTag).filter((tag) => tag && !value.includes(tag))
    if (added.length > 0) onChange([...value, ...new Set(added)])
    onDraftChange('')
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-sm font-medium">{t('note.tagsLabel')}</p>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t('note.tagsLabel')}>
          {value.map((tag) => (
            <li key={tag} className="flex max-w-full items-center gap-1 rounded-md bg-muted/60 py-0.5 pr-0.5 pl-2 text-sm">
              <LabelMark mark={marks.get(tag)} />
              <span className="min-w-0 truncate">{tag}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={t('note.removeTag', { name: tag })}
                onClick={() => onChange(value.filter((other) => other !== tag))}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Input
        aria-label={t('note.addTag')}
        placeholder={t('note.addTag')}
        maxLength={50}
        value={draft}
        onChange={(event) => {
          // A comma finishes a tag, as in the old comma-separated field.
          if (event.target.value.includes(',')) add(event.target.value)
          else onDraftChange(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            add(draft)
          }
          if (event.key === 'Backspace' && draft === '' && value.length > 0) onChange(value.slice(0, -1))
        }}
        onBlur={() => draft.trim() && add(draft)}
      />
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label={t('note.suggestedTags')} role="group">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => add(tag.name)}
              className="flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground outline-none hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-3" aria-hidden />
              <LabelMark mark={tag} />
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
