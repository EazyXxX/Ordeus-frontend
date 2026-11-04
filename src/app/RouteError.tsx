import { useRouteError } from 'react-router'

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
      <h2 className="text-base font-medium">Не удалось показать этот раздел</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Остальные разделы продолжают работать. Если ошибка повторится, проверьте, что сервер запущен на свежем коде.
      </p>
      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
        Обновить страницу
      </Button>
      <details className="max-w-lg text-xs text-muted-foreground">
        <summary className="cursor-pointer">Подробности</summary>
        <p className="mt-1 break-words">{describe(error)}</p>
      </details>
    </div>
  )
}
