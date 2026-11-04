import { NavLink, useLocation } from 'react-router'

import { cn } from '@/lib/utils'
import { DiaryLibrary } from './DiaryLibrary'
import { ZenMode } from './ZenMode'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
    isActive ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground',
  )

export default function DiaryPage() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav aria-label="Режим дневника" className="flex shrink-0 gap-1 border-b p-2">
        <NavLink to="/diary" end className={tabClass}>
          Записи
        </NavLink>
        <NavLink to="/diary/zen" className={tabClass}>
          Дзен
        </NavLink>
      </nav>
      {pathname === '/diary/zen' ? <ZenMode /> : <DiaryLibrary />}
    </div>
  )
}
