import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { t } from '@/i18n'
import { ZenComposer } from '@/components/zen/ZenComposer'
import { CAPTURES_KEY, createCapture } from './api'

const PLACEHOLDERS = [
  t('tasks.example1'),
  t('tasks.example2'),
  t('tasks.example3'),
  t('tasks.example4'),
  t('tasks.example5'),
  t('tasks.example6'),
  t('tasks.example7'),
  t('tasks.example8'),
]

const LAST_PLACEHOLDER_KEY = 'ordeus.tasks.zen-placeholder'

function readLastPlaceholder() {
  try {
    return localStorage.getItem(LAST_PLACEHOLDER_KEY)
  } catch {
    return null
  }
}

function rememberPlaceholder(placeholder: string) {
  try {
    localStorage.setItem(LAST_PLACEHOLDER_KEY, placeholder)
  } catch {
    // Only the variety suffers: a phrase may repeat.
  }
}

// Random, but never the phrase shown last time, even after a reload.
function pickPlaceholder() {
  const last = readLastPlaceholder()
  const choices = PLACEHOLDERS.filter((placeholder) => placeholder !== last)
  return choices[Math.floor(Math.random() * choices.length)]
}

export function TasksZen({ active }: { active: number }) {
  const queryClient = useQueryClient()
  const [placeholder] = useState(pickPlaceholder)

  // Remembered after rendering, because only the phrase on screen counts.
  useEffect(() => rememberPlaceholder(placeholder), [placeholder])

  return (
    <ZenComposer
      section="tasks"
      heading={(name) => t('tasks.zenHeading', { name })}
      placeholder={placeholder}
      idleStatus={t('tasks.zenIdle')}
      activeStatus={(count) => t('tasks.creatingCount', { count })}
      acceptedTitle={t('tasks.accepted')}
      acceptedDescription={t('tasks.acceptedText')}
      active={active}
      onSubmit={createCapture}
      onSent={() => queryClient.invalidateQueries({ queryKey: CAPTURES_KEY })}
    />
  )
}
