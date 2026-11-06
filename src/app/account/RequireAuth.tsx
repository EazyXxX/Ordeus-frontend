import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { useSession } from './session'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending, isError, refetch } = useSession()

  if (isPending) {
    return <p className="p-6 text-sm text-muted-foreground">Загружаем…</p>
  }
  if (isError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">Не удалось связаться с сервером.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Повторить
        </Button>
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return children
}
