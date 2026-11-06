import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Cloud, Settings2 } from 'lucide-react'
import { Link } from 'react-router'

import { t } from '@/i18n'
import { AI_KEY, fetchAiSettings, updateAiSettings, type AiSettings, type AiSettingsChange } from '@/app/account/ai'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const REFRESH_INTERVAL_MS = 15_000
const REMOTE_VALUE = 'remote'

function findProblem({ provider, local }: AiSettings) {
  if (provider !== 'local') return null
  if (!local.available) return t('zen.localDown')
  if (!local.models.includes(local.model)) return t('zen.modelMissing')
  return null
}

export function ModelSelector() {
  const queryClient = useQueryClient()
  const { data: settings, isError } = useQuery({
    queryKey: AI_KEY,
    queryFn: fetchAiSettings,
    refetchInterval: REFRESH_INTERVAL_MS,
    retry: false,
  })

  const { mutate: change, isError: changeFailed } = useMutation({
    mutationFn: (next: AiSettingsChange) => updateAiSettings(next),
    onSuccess: (saved) => queryClient.setQueryData(AI_KEY, saved),
  })

  if (!settings) {
    return isError ? <span className="text-xs text-destructive">{t('server.down')}</span> : null
  }

  const remote = settings.provider === 'remote'
  const current = remote ? settings.remote.model : settings.local.model
  const problem = changeFailed ? t('zen.modelChangeFailed') : findProblem(settings)

  function select(value: string) {
    change(value === REMOTE_VALUE ? { provider: 'remote' } : { provider: 'local', localModel: value })
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title={problem ?? undefined}
          aria-label={t('zen.modelLabel', { name: current })}
          className={cn('max-w-24 font-normal text-muted-foreground sm:max-w-40', problem && 'text-destructive')}
          onClick={(event) => event.stopPropagation()}
        >
          {remote && <Cloud aria-label={t('zen.viaApi')} />}
          <span className="truncate">{current}</span>
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {problem && <DropdownMenuLabel className="text-destructive">{problem}</DropdownMenuLabel>}
        <DropdownMenuRadioGroup value={remote ? REMOTE_VALUE : settings.local.model} onValueChange={select}>
          <DropdownMenuLabel>{t('zen.onComputer')}</DropdownMenuLabel>
          {settings.local.models.map((model) => (
            <DropdownMenuRadioItem key={model} value={model}>
              <span className="truncate">{model}</span>
            </DropdownMenuRadioItem>
          ))}
          {settings.remote.model && (
            <>
              <DropdownMenuLabel>{t('zen.viaApiWarning')}</DropdownMenuLabel>
              <DropdownMenuRadioItem value={REMOTE_VALUE}>
                <Cloud aria-hidden />
                <span className="truncate">{settings.remote.model}</span>
              </DropdownMenuRadioItem>
            </>
          )}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account">
            <Settings2 />
            {t('zen.configure')}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
