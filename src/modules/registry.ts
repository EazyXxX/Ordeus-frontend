import type { ComponentType } from 'react'
import { BookOpen, CalendarDays, KanbanSquare, type LucideIcon } from 'lucide-react'

export type OrganizerModule = {
  title: string
  path: string
  icon: LucideIcon
  load: () => Promise<{ default: ComponentType }>
}

// The drawer and the routes are both built from this list, so a new section
// only needs an entry here and its page in src/modules/<name>/.
export const modules: OrganizerModule[] = [
  { title: 'Дневник', path: '/diary', icon: BookOpen, load: () => import('./diary/DiaryPage') },
  { title: 'Задачи', path: '/tasks', icon: KanbanSquare, load: () => import('./tasks/TasksPage') },
  { title: 'Календарь', path: '/calendar', icon: CalendarDays, load: () => import('./calendar/CalendarPage') },
]
