import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { t } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api'
import {
  AI_KEY,
  deleteRemoteAi,
  fetchAiSettings,
  fetchRemoteModels,
  updateAiSettings,
  type AiProvider,
  type AiSettings,
} from './ai'
import { Section } from './Section'

const VENDORS = [
  { name: 'OpenAI', url: 'https://api.openai.com/v1' },
  { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1' },
  { name: 'Google Gemini', url: 'https://generativelanguage.googleapis.com/v1beta/openai' },
  { name: 'Anthropic', url: 'https://api.anthropic.com/v1' },
  { name: 'DeepSeek', url: 'https://api.deepseek.com/v1' },
  { name: 'Groq', url: 'https://api.groq.com/openai/v1' },
]

const CUSTOM_VENDOR = ''
const selectClass = 'h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm'
const fieldClass = 'flex flex-col gap-1 text-xs font-medium text-muted-foreground'

const SAVE_ERRORS: Record<string, string> = {
  'api address must be a public https url': t('ai.badUrl'),
  'model name must be 1 to 200 characters long': t('ai.badModel'),
  'api key is too long': t('ai.longKey'),
  'remote model is not configured': t('ai.notConfigured'),
  'local models are unavailable': t('ai.ollamaDown'),
  'unknown model': t('ai.unknownModel'),
}

function describeSaveError(error: unknown) {
  const reason = error instanceof ApiError ? SAVE_ERRORS[error.reason] : undefined
  return reason ?? t('ai.saveFailed')
}

function AiForm({ settings }: { settings: AiSettings }) {
  const queryClient = useQueryClient()
  const [provider, setProvider] = useState<AiProvider>(settings.provider)
  const [localModel, setLocalModel] = useState(settings.local.model)
  const [baseUrl, setBaseUrl] = useState(settings.remote.baseUrl)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(settings.remote.model)

  const vendor = VENDORS.find(({ url }) => url === baseUrl)?.url ?? CUSTOM_VENDOR
  const addressChanged = baseUrl.trim() !== settings.remote.baseUrl
  const keySaved = settings.remote.hasApiKey && !addressChanged
  const localChoices = settings.local.models.includes(localModel)
    ? settings.local.models
    : [localModel, ...settings.local.models]

  const check = useMutation({ mutationFn: () => fetchRemoteModels({ baseUrl, apiKey }) })

  const save = useMutation({
    mutationFn: () =>
      updateAiSettings({
        provider,
        localModel: settings.local.available && settings.local.models.includes(localModel) ? localModel : undefined,
        // The remote fields only matter when that is the choice being saved.
        remote: provider === 'remote' ? { baseUrl, model, apiKey } : undefined,
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(AI_KEY, saved)
      setApiKey('')
      check.reset()
    },
  })

  const disconnect = useMutation({
    mutationFn: deleteRemoteAi,
    onSuccess: (saved) => {
      queryClient.setQueryData(AI_KEY, saved)
      setProvider('local')
      setBaseUrl('')
      setModel('')
      setApiKey('')
      check.reset()
    },
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    save.mutate()
  }

  function resetResults() {
    save.reset()
    check.reset()
  }

  const remoteIncomplete = provider === 'remote' && (!baseUrl.trim() || !model.trim())

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className={fieldClass}>
        {t('ai.whichModel')}
        <select
          className={selectClass}
          value={provider}
          onChange={(event) => {
            setProvider(event.target.value as AiProvider)
            resetResults()
          }}
        >
          <option value="local">{t('ai.local')}</option>
          <option value="remote">{t('ai.remote')}</option>
        </select>
      </label>

      {provider === 'local' && (
        <label className={fieldClass}>
          {t('ai.localModel')}
          <select
            className={selectClass}
            disabled={!settings.local.available}
            value={localModel}
            onChange={(event) => {
              setLocalModel(event.target.value)
              save.reset()
            }}
          >
            {localChoices.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          {!settings.local.available && (
            <span className="font-normal text-destructive">{t('ai.ollamaDown')}</span>
          )}
        </label>
      )}

      {provider === 'remote' && (
        <>
          <label className={fieldClass}>
            {t('ai.vendor')}
            <select
              className={selectClass}
              value={vendor}
              onChange={(event) => {
                setBaseUrl(event.target.value)
                resetResults()
              }}
            >
              <option value={CUSTOM_VENDOR}>{t('ai.otherVendor')}</option>
              {VENDORS.map(({ name, url }) => (
                <option key={url} value={url}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className={fieldClass}>
            {t('ai.address')}
            <Input
              required
              type="url"
              placeholder="https://api.example.com/v1"
              value={baseUrl}
              onChange={(event) => {
                setBaseUrl(event.target.value)
                resetResults()
              }}
            />
          </label>
          <label className={fieldClass}>
            {t('ai.key')}
            <Input
              type="password"
              autoComplete="off"
              placeholder={keySaved ? t('ai.keySaved', { hint: settings.remote.keyHint }) : t('ai.keyPlaceholder')}
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value)
                resetResults()
              }}
            />
            {settings.remote.hasApiKey && addressChanged && (
              <span className="font-normal">{t('ai.keyAgain')}</span>
            )}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!baseUrl.trim() || check.isPending}
              onClick={() => check.mutate()}
            >
              {t('ai.check')}
            </Button>
            <p role="status" className={check.isError ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
              {check.isPending
                ? t('ai.checking')
                : check.isError
                  ? t('ai.checkFailed')
                  : check.data
                    ? t('ai.connected', { count: check.data.models.length })
                    : ''}
            </p>
          </div>
          <label className={fieldClass}>
            {t('ai.model')}
            <Input
              required
              list="remote-models"
              placeholder={t('ai.modelPlaceholder')}
              maxLength={200}
              value={model}
              onChange={(event) => {
                setModel(event.target.value)
                save.reset()
              }}
            />
            <datalist id="remote-models">
              {check.data?.models.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>
          <p className="text-xs text-muted-foreground">
            {t('ai.privacy')}
          </p>
        </>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={save.isPending || remoteIncomplete}>
          {t('common.save')}
        </Button>
        {settings.remote.baseUrl && provider === 'remote' && (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            disabled={disconnect.isPending}
            onClick={() => disconnect.mutate()}
          >
            {t('ai.disconnect')}
          </Button>
        )}
        <p role="status" className={save.isError ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
          {save.isError
            ? describeSaveError(save.error)
            : save.isSuccess
              ? t('common.saved')
              : ''}
        </p>
      </div>
    </form>
  )
}

export function AiSection() {
  const { data: settings, isError } = useQuery({ queryKey: AI_KEY, queryFn: fetchAiSettings, retry: false })

  return (
    <Section title={t('ai.title')}>
      {isError && <p className="text-sm text-muted-foreground">{t('ai.loadFailed')}</p>}
      {settings && <AiForm settings={settings} />}
    </Section>
  )
}
