import { useEffect, type ReactNode } from 'react'
import { Navigate } from 'react-router'

import { applyLanguage, language, t } from '@/i18n'
import { Button } from '@/components/ui/button'
import { useSession } from './session'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending, isError, refetch } = useSession()
  const accountLanguage = session?.user.language

  // The account's choice wins over this browser's, including after a switch.
  useEffect(() => {
    if (accountLanguage && accountLanguage !== language) applyLanguage(accountLanguage)
  }, [accountLanguage])

  if (isPending) {
    return <p className="p-6 text-sm text-muted-foreground">{t('common.loading')}</p>
  }
  if (isError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t('common.serverUnreachable')}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t('common.retry')}
        </Button>
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return children
}
