import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'

import { ColorPicker } from '@/components/ColorPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api'
import type { Color } from '@/lib/colors'
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
  updateProfile,
  useCurrentUser,
  useSession,
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
    <Section title="Профиль">
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
          aria-label="Имя"
          placeholder="Имя"
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
            Сохранить
          </Button>
          <p role="status" className={isError ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
            {isError ? 'Не удалось сохранить.' : isSuccess ? 'Сохранено' : ''}
          </p>
        </div>
      </form>
    </Section>
  )
}

function Stats() {
  const { data: stats, isError } = useQuery({ queryKey: ['account', 'stats'], queryFn: fetchStats })

  const items = stats && [
    { label: 'Записей', value: stats.notes },
    { label: 'Папок', value: stats.folders },
    { label: 'Задач', value: stats.tasks },
    { label: 'Заметок в календаре', value: stats.calendarNotes },
  ]

  return (
    <Section title="Статистика">
      {isError && <p className="text-sm text-muted-foreground">Не удалось загрузить статистику.</p>}
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
  if (error instanceof ApiError && error.status === 403) return 'Текущий пароль указан неверно.'
  if (error instanceof ApiError && error.status === 400) return 'Новый пароль не подходит: от 8 символов.'
  return 'Не удалось сменить пароль.'
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
    <Section title="Пароль">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input
          required
          type="password"
          aria-label="Текущий пароль"
          placeholder="Текущий пароль"
          autoComplete="current-password"
          value={current}
          onChange={field(setCurrent)}
        />
        <Input
          required
          type="password"
          aria-label="Новый пароль"
          placeholder={`Новый пароль, не короче ${MIN_PASSWORD_LENGTH} символов`}
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          value={next}
          onChange={field(setNext)}
        />
        <Input
          required
          type="password"
          aria-label="Повторите новый пароль"
          placeholder="Повторите новый пароль"
          autoComplete="new-password"
          value={repeat}
          onChange={field(setRepeat)}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending || mismatch}>
            Сменить пароль
          </Button>
          <p
            role="status"
            className={error || mismatch ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}
          >
            {mismatch
              ? 'Пароли не совпадают.'
              : error
                ? describePasswordError(error)
                : isSuccess
                  ? 'Пароль изменён. Другие устройства вышли из аккаунта.'
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
    <Section title="Аккаунты на этом устройстве">
      <ul className="flex flex-col gap-2">
        {session.accounts.map((account) => (
          <li key={account.id} className="flex items-center gap-3">
            <AccountAvatar name={account.name} color={account.color} className="size-8 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{account.name}</p>
              <p className="truncate text-xs text-muted-foreground">{account.email}</p>
            </div>
            {account.id === session.user.id ? (
              <span className="text-xs text-muted-foreground">Активен</span>
            ) : (
              <Button variant="outline" size="sm" onClick={() => open(account.id)}>
                Переключиться
              </Button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/login?add=1">Добавить аккаунт</Link>
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={leave}>
          Выйти из {session.user.name}
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
        <Stats />
        <AiSection />
        <Password />
        <DeviceAccounts />
      </div>
    </div>
  )
}
