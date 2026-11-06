import { lazy, Suspense, type ComponentType } from 'react'
import { useLocation } from 'react-router'

import { ModeTabs } from '@/components/ModeTabs'
import { DiaryLibrary } from './DiaryLibrary'
import { ZenMode } from './ZenMode'

// The graph library is large, so it loads only when this tab is opened.
const DiaryGraph = lazy(() => import('./DiaryGraph').then(({ DiaryGraph }) => ({ default: DiaryGraph })))

const TABS = [
  { to: '/diary', label: 'Записи' },
  { to: '/diary/graph', label: 'Граф' },
  { to: '/diary/zen', label: 'Дзен' },
]

const VIEWS: Record<string, ComponentType> = {
  '/diary/graph': DiaryGraph,
  '/diary/zen': ZenMode,
}

export default function DiaryPage() {
  const { pathname } = useLocation()
  const View = VIEWS[pathname] ?? DiaryLibrary

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ModeTabs label="Режим дневника" tabs={TABS} />
      <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Загружаем граф…</p>}>
        <View />
      </Suspense>
    </div>
  )
}
