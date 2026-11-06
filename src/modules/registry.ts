import type { ComponentType } from 'react'
import { BookOpen, CalendarDays, KanbanSquare, type LucideIcon } from 'lucide-react'
import { t } from '@/i18n'

export type OrganizerModule = {
  title: string
  path: string
  icon: LucideIcon
  load: () => Promise<{ default: ComponentType }>
}

// The drawer and the routes are both built from this list, so a new section
// only needs an entry here and its page in src/modules/<name>/.
export const modules: OrganizerModule[] = [
  { title: t('nav.diary'), path: '/diary', icon: BookOpen, load: () => import('./diary/DiaryPage') },
  { title: t('nav.tasks'), path: '/tasks', icon: KanbanSquare, load: () => import('./tasks/TasksPage') },
  { title: t('nav.calendar'), path: '/calendar', icon: CalendarDays, load: () => import('./calendar/CalendarPage') },
]
