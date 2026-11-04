import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { BOARD_QUERY_KEY, fetchBoard } from './api'
import { KanbanBoard } from './KanbanBoard'

export default function KanbanPage() {
  const { data, isPending, refetch } = useQuery({ queryKey: BOARD_QUERY_KEY, queryFn: fetchBoard })

  // A failed background refresh keeps the last loaded board on screen.
  if (data) {
    return <KanbanBoard columns={data.columns} />
  }
  if (isPending) {
    return <p className="p-6 text-sm text-muted-foreground">Загружаем доску…</p>
  }
  return (
    <div className="flex flex-col items-start gap-3 p-6">
      <p className="text-sm text-muted-foreground">Не удалось загрузить доску.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>
        Повторить
      </Button>
    </div>
  )
}
