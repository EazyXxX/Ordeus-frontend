import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { fetchModels, MODELS_KEY, selectModel } from './api'

const REFRESH_INTERVAL_MS = 15_000

export function ModelSelector() {
  const queryClient = useQueryClient()
  const { data, isError } = useQuery({
    queryKey: MODELS_KEY,
    queryFn: fetchModels,
    refetchInterval: REFRESH_INTERVAL_MS,
    retry: false,
  })

  const { mutate: select, isError: selectFailed } = useMutation({
    mutationFn: selectModel,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: MODELS_KEY })
    },
  })

  if (!data) {
    return isError ? <span className="text-xs text-destructive">Сервер недоступен</span> : null
  }

  const problem = !data.available
    ? 'Модели недоступны. Проверьте, запущена ли Ollama.'
    : !data.models.includes(data.current)
      ? 'Выбранной модели нет у провайдера.'
      : selectFailed
        ? 'Не удалось сменить модель.'
        : null

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title={problem ?? undefined}
          aria-label={`Модель: ${data.current}`}
          className={cn('max-w-40 font-normal text-muted-foreground', problem && 'text-destructive')}
          onClick={(event) => event.stopPropagation()}
        >
          <span className="truncate">{data.current}</span>
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{problem ?? 'Модель для разбора записей'}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={data.current} onValueChange={select}>
          {data.models.map((model) => (
            <DropdownMenuRadioItem key={model} value={model}>
              <span className="truncate">{model}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
