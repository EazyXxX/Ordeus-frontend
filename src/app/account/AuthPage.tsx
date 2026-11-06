import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, Navigate, useSearchParams } from 'react-router'

import { t } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api'
import { enterApp, signIn, signUp, useSession } from './session'

type Mode = 'login' | 'register'

const MIN_PASSWORD_LENGTH = 8

function describeError(error: unknown, mode: Mode) {
  if (error instanceof ApiError) {
    if (error.status === 401) return t('auth.badCredentials')
    if (error.status === 409) {
      return mode === 'register' ? t('auth.emailTaken') : t('auth.tooManyAccounts')
    }
    if (error.status === 400) return t('auth.checkFields')
  }
  return t('common.serverUnreachable')
}

const COPY = {
  login: { title: t('auth.loginTitle'), action: t('common.signIn'), hint: t('auth.noAccount'), link: t('auth.register') },
  register: { title: t('auth.registerTitle'), action: t('auth.create'), hint: t('auth.hasAccount'), link: t('common.signIn') },
}

export function AuthPage({ mode }: { mode: Mode }) {
  const [searchParams] = useSearchParams()
  const { data: session, isPending } = useSession()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  // ?add=1 keeps this page open for signing in to one more account.
  const adding = searchParams.has('add')
  const suffix = adding ? '?add=1' : ''
  const otherPage = `${mode === 'login' ? '/register' : '/login'}${suffix}`

  const { mutate: submit, isPending: submitting, error } = useMutation({
    mutationFn: () => (mode === 'login' ? signIn({ email, password }) : signUp({ email, name, password })),
    onSuccess: () => enterApp(),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!submitting) submit()
  }

  if (!isPending && session && !adding) return <Navigate to="/" replace />

  const copy = COPY[mode]

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="size-6 dark:invert" />
          <h1 className="text-lg font-medium">{adding ? t('common.addAccount') : copy.title}</h1>
        </div>

        {mode === 'register' && (
          <Input
            required
            autoFocus
            aria-label={t('common.name')}
            placeholder={t('common.name')}
            autoComplete="name"
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}
        <Input
          required
          autoFocus={mode === 'login'}
          type="email"
          aria-label={t('common.email')}
          placeholder={t('common.email')}
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          required
          type="password"
          aria-label={t('common.password')}
          placeholder={mode === 'register' ? t('auth.passwordRule', { count: MIN_PASSWORD_LENGTH }) : t('common.password')}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          minLength={mode === 'register' ? MIN_PASSWORD_LENGTH : undefined}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {describeError(error, mode)}
          </p>
        )}

        <Button type="submit" disabled={submitting}>
          {copy.action}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {copy.hint}{' '}
          <Link to={otherPage} className="text-foreground underline underline-offset-4">
            {copy.link}
          </Link>
        </p>
        {adding && (
          <Link to="/" className="text-center text-sm text-muted-foreground underline underline-offset-4">
            {t('auth.back')}
          </Link>
        )}
      </form>
    </main>
  )
}
