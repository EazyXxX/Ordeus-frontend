import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type InlineAddProps = {
  label: string
  placeholder: string
  onSubmit: (title: string) => void
}

export function InlineAdd({ label, placeholder, onSubmit }: InlineAddProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  function close() {
    setOpen(false)
    setValue('')
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const title = value.trim()
    if (!title) return
    onSubmit(title)
    setValue('')
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => setOpen(true)}>
        <Plus />
        {label}
      </Button>
    )
  }

  return (
    <form onSubmit={submit}>
      <Input
        autoFocus
        aria-label={placeholder}
        placeholder={placeholder}
        maxLength={200}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => !value.trim() && close()}
        onKeyDown={(event) => event.key === 'Escape' && close()}
      />
    </form>
  )
}
