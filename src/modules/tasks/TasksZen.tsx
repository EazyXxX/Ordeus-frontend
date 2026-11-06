import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { ZenComposer } from '@/components/zen/ZenComposer'
import { CAPTURES_KEY, createCapture } from './api'

const PLACEHOLDERS = [
  'Подготовить отчёт к пятнице и записаться к врачу',
  'Завтра позвонить в банк, а к среде закончить презентацию',
  'Срочно оплатить интернет и до выходных купить подарок маме',
  'Разобрать балкон, продлить страховку и ответить Ивану',
  'К понедельнику собрать документы, потом записаться в МФЦ',
  'Через неделю сдать проект, а завтра созвониться с командой',
  'Купить билеты до конца месяца и забронировать отель',
  'Починить кран на кухне и заехать в сервис на этой неделе',
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
      heading={(name) => `Что нужно сделать, ${name}?`}
      placeholder={placeholder}
      idleStatus="Нейросеть сама создаст задачи и опишет их"
      activeStatus={(count) => `Создаю задачи: ${count}`}
      acceptedTitle="Принято в работу"
      acceptedDescription="Нейросеть создаст задачи и опишет их."
      active={active}
      onSubmit={createCapture}
      onSent={() => queryClient.invalidateQueries({ queryKey: CAPTURES_KEY })}
    />
  )
}
