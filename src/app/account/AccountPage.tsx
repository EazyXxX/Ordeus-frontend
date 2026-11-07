import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'

import { applyLanguage, language, t, type Language } from '@/i18n'
import { ColorPicker } from '@/components/ColorPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api'
import type { Color } from '@/lib/colors'
import { BOARD_QUERY_KEY, fetchBoard } from '@/modules/tasks/api'
import { AccountAvatar } from './AccountAvatar'
import { AiSection } from './AiSection'
import { Section } from './Section'
import {
  changePassword,
  enterApp,
  fetchStats,
  SESSION_KEY,
  signOut,
  switchAccount,
  updateLanguage,
  updateProfile,
  updateTaskSettings,
  useCurrentUser,
  useSession,
  type TaskCategories,
} from './session'

const MIN_PASSWORD_LENGTH = 8

function Profile() {
  const queryClient = useQueryClient()
  const user = useCurrentUser()
  const [name, setName] = useState(user.name)
  const [color, setColor] = useState<Color>(user.color)

  const { mutate: save, isPending, isError, isSuccess, reset } = useMutation({
    mutationFn: () => updateProfile({ name: name.trim(), color }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSION_KEY }),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (name.trim()) save()
  }

  return (
    <Section title={t('account.profile')}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <AccountAvatar name={name || user.name} color={color} className="size-12 text-base" />
          <div className="min-w-0">
            <p className="truncate font-medium">{name || user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Input
          required
          aria-label={t('common.name')}
          placeholder={t('common.name')}
          maxLength={100}
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            reset()
          }}
        />
        <ColorPicker
          value={color}
          onChange={(next) => {
            setColor(next)
            reset()
          }}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending || !name.trim()}>
            {t('common.save')}
          </Button>
          <p role="status" className={isError ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
            {isError ? t('account.saveFailed') : isSuccess ? t('common.saved') : ''}
          </p>
        </div>
      </form>
    </Section>
  )
}

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'ru', label: t('language.ru') },
  { value: 'en', label: t('language.en') },
]

function LanguageSection() {
  const choose = useMutation({
    mutationFn: updateLanguage,
    onSuccess: (_, next) => applyLanguage(next),
  })

  return (
    <Section title={t('account.language')}>
      <div role="group" aria-label={t('account.language')} className="flex gap-2">
        {LANGUAGES.map(({ value, label }) => (
          <Button
            key={value}
            variant={value === language ? 'secondary' : 'outline'}
            aria-pressed={value === language}
            disabled={choose.isPending}
            onClick={() => choose.mutate(value)}
          >
            {label}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {choose.isError ? t('account.languageFailed') : t('account.languageHint')}
      </p>
    </Section>
  )
}

const CATEGORY_MODES: { value: TaskCategories; label: string }[] = [
  { value: 'all', label: t('account.categoriesAll') },
  { value: 'backlog', label: t('account.categoriesBacklog') },
  { value: 'off', label: t('account.categoriesOff') },
]

function Settings() {
  const queryClient = useQueryClient()
  const { taskCategories, backlogColumnId } = useCurrentUser()
  const board = useQuery({ queryKey: BOARD_QUERY_KEY, queryFn: fetchBoard })
  const columns = board.data?.columns ?? []
  // A deleted column stays in the session until the next load, so it is checked here.
  const backlog = columns.find((column) => column.id === backlogColumnId)

  const save = useMutation({
    mutationFn: updateTaskSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSION_KEY }),
  })

  return (
    <Section title={t('account.settings')}>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">{t('account.categories')}</p>
        <div role="group" aria-label={t('account.categories')} className="flex flex-wrap gap-2">
          {CATEGORY_MODES.map(({ value, label }) => (
            <Button
              key={value}
              variant={value === taskCategories ? 'secondary' : 'outline'}
              aria-pressed={value === taskCategories}
              disabled={save.isPending}
              onClick={() => save.mutate({ categories: value, backlogColumnId: backlog?.id ?? null })}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {taskCategories === 'backlog' && (
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          {t('account.backlogColumn')}
          <select
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm text-foreground"
            disabled={save.isPending || columns.length === 0}
            value={backlog?.id ?? ''}
            onChange={(event) =>
              save.mutate({ categories: taskCategories, backlogColumnId: event.target.value || null })
            }
          >
            <option value="">
              {columns[0] ? t('account.backlogFirst', { name: columns[0].title }) : t('account.backlogNoColumns')}
            </option>
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.title}
              </option>
            ))}
          </select>
        </label>
      )}

      <p className="text-xs text-muted-foreground">
        {save.isError
          ? t('account.settingsFailed')
          : taskCategories === 'backlog'
            ? t('account.backlogHint')
            : t('account.categoriesHint')}
      </p>
    </Section>
  )
}

function Stats() {
  const { data: stats, isError } = useQuery({ queryKey: ['account', 'stats'], queryFn: fetchStats })

  const items = stats && [
    { label: t('account.statNotes'), value: stats.notes },
    { label: t('account.statFolders'), value: stats.folders },
    { label: t('account.statTasks'), value: stats.tasks },
    { label: t('account.statCalendar'), value: stats.calendarNotes },
  ]

  return (
    <Section title={t('account.stats')}>
      {isError && <p className="text-sm text-muted-foreground">{t('account.statsFailed')}</p>}
      {items && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map(({ label, value }) => (
            <div key={label} className="flex flex-col-reverse gap-1">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-2xl font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Section>
  )
}

function describePasswordError(error: unknown) {
  if (error instanceof ApiError && error.status === 403) return t('account.wrongPassword')
  if (error instanceof ApiError && error.status === 400) return t('account.badPassword')
  return t('account.passwordFailed')
}

function Password() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')

  const { mutate: save, isPending, error, isSuccess, reset } = useMutation({
    mutationFn: () => changePassword({ current, next }),
    onSuccess: () => {
      setCurrent('')
      setNext('')
      setRepeat('')
    },
  })

  const mismatch = repeat !== '' && next !== repeat

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!mismatch) save()
  }

  function field(setter: (value: string) => void) {
    return (event: { target: { value: string } }) => {
      setter(event.target.value)
      reset()
    }
  }

  return (
    <Section title={t('common.password')}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input
          required
          type="password"
          aria-label={t('account.currentPassword')}
          placeholder={t('account.currentPassword')}
          autoComplete="current-password"
          value={current}
          onChange={field(setCurrent)}
        />
        <Input
          required
          type="password"
          aria-label={t('account.newPassword')}
          placeholder={t('account.newPasswordRule', { count: MIN_PASSWORD_LENGTH })}
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          value={next}
          onChange={field(setNext)}
        />
        <Input
          required
          type="password"
          aria-label={t('account.repeatPassword')}
          placeholder={t('account.repeatPassword')}
          autoComplete="new-password"
          value={repeat}
          onChange={field(setRepeat)}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending || mismatch}>
            {t('account.changePassword')}
          </Button>
          <p
            role="status"
            className={error || mismatch ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}
          >
            {mismatch
              ? t('account.mismatch')
              : error
                ? describePasswordError(error)
                : isSuccess
                  ? t('account.passwordChanged')
                  : ''}
          </p>
        </div>
      </form>
    </Section>
  )
}

function DeviceAccounts() {
  const { data: session } = useSession()
  if (!session) return null

  async function open(userId: string) {
    await switchAccount(userId)
    enterApp('/account')
  }

  async function leave() {
    await signOut()
    enterApp()
  }

  return (
    <Section title={t('account.devices')}>
      <ul className="flex flex-col gap-2">
        {session.accounts.map((account) => (
          <li key={account.id} className="flex items-center gap-3">
            <AccountAvatar name={account.name} color={account.color} className="size-8 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{account.name}</p>
              <p className="truncate text-xs text-muted-foreground">{account.email}</p>
            </div>
            {account.id === session.user.id ? (
              <span className="text-xs text-muted-foreground">{t('account.active')}</span>
            ) : (
              <Button variant="outline" size="sm" onClick={() => open(account.id)}>
                {t('account.switch')}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/login?add=1">{t('common.addAccount')}</Link>
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={leave}>
          {t('account.signOutOf', { name: session.user.name })}
        </Button>
      </div>
    </Section>
  )
}

export default function AccountPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
        <Profile />
        <LanguageSection />
        <Settings />
        <Stats />
        <AiSection />
        <Password />
        <DeviceAccounts />
      </div>
    </div>
  )
}
