import { lazy, Suspense, type ComponentType } from 'react'
import { useLocation } from 'react-router'

import { t } from '@/i18n'
import { ModeTabs } from '@/components/ModeTabs'
import { DiaryLibrary } from './DiaryLibrary'
import { DiaryJournal } from './DiaryJournal'
import { ZenMode } from './ZenMode'

// The graph library is large, so it loads only when this tab is opened.
const DiaryGraph = lazy(() => import('./DiaryGraph').then(({ DiaryGraph }) => ({ default: DiaryGraph })))

const DiaryBook = lazy(() => import('./DiaryBook').then(({ DiaryBook }) => ({ default: DiaryBook })))

const TABS = [
  { to: '/diary', label: t('diary.notes') },
  { to: '/diary/journal', label: t('journal.title') },
  { to: '/diary/graph', label: t('diary.graph') },
  { to: '/diary/zen', label: t('tasks.zen') },
]

const VIEWS: Record<string, ComponentType> = {
  '/diary/journal': DiaryJournal,
  '/diary/graph': DiaryGraph,
  '/diary/zen': ZenMode,
  '/diary/book': DiaryBook,
}

export default function DiaryPage() {
  const { pathname } = useLocation()
  const View = VIEWS[pathname] ?? DiaryLibrary

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ModeTabs label={t('diary.mode')} tabs={TABS} />
      <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">{t('common.loading')}</p>}>
        <View />
      </Suspense>
    </div>
  )
}
