import { useRouteError } from 'react-router'

import { t } from '@/i18n'
import { Button } from '@/components/ui/button'

function describe(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

// Shown in place of a failed route. For a module route the shell stays on
// screen, so the other sections remain one click away.
export function RouteError() {
  const error = useRouteError()

  return (
    <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="text-base font-medium">{t('error.title')}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t('error.text')}
      </p>
      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
        {t('error.reload')}
      </Button>
      <details className="max-w-lg text-xs text-muted-foreground">
        <summary className="cursor-pointer">{t('error.details')}</summary>
        <p className="mt-1 break-words">{describe(error)}</p>
      </details>
    </div>
  )
}
