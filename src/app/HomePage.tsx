import { ArrowRight, BookOpen, CalendarDays, KanbanSquare, Sparkles, UserRound, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

import { t } from '@/i18n'
import { useCurrentUser } from '@/app/account/session'
import { OrderRing } from '@/app/OrderRing'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STEPS = [
  { title: t('home.step1Title'), text: t('home.step1Text') },
  { title: t('home.step2Title'), text: t('home.step2Text') },
  { title: t('home.step3Title'), text: t('home.step3Text') },
]

type Feature = {
  title: string
  text: string
  icon: LucideIcon
  wide?: boolean
  links: { to: string; label: string; hint: string }[]
}

const FEATURES: Feature[] = [
  {
    title: t('nav.diary'),
    text: t('home.diaryText'),
    icon: BookOpen,
    wide: true,
    links: [
      { to: '/diary/journal', label: t('journal.title'), hint: t('home.journalHint') },
      { to: '/diary/book', label: t('book.title'), hint: t('home.bookHint') },
      { to: '/diary/zen', label: t('tasks.zen'), hint: t('home.zenHint') },
      { to: '/diary', label: t('diary.notes'), hint: t('home.notesHint') },
      { to: '/diary/graph', label: t('diary.graph'), hint: t('home.graphHint') },
    ],
  },
  {
    title: t('nav.tasks'),
    text: t('home.tasksText'),
    icon: KanbanSquare,
    links: [
      { to: '/tasks/zen', label: t('tasks.zen'), hint: t('home.tasksZenHint') },
      { to: '/tasks', label: t('tasks.kanban'), hint: t('home.kanbanHint') },
      { to: '/tasks/list', label: t('tasks.list'), hint: t('home.listHint') },
    ],
  },
  {
    title: t('nav.calendar'),
    text: t('home.calendarText'),
    icon: CalendarDays,
    links: [{ to: '/calendar', label: t('home.openCalendar'), hint: t('home.calendarHint') }],
  },
  {
    title: t('common.account'),
    text: t('home.accountText'),
    icon: UserRound,
    wide: true,
    links: [{ to: '/account', label: t('home.openAccount'), hint: t('home.accountHint') }],
  },
]

const RISE = 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:fill-mode-both'

const delayed = (seconds: number) => ({ animationDelay: `${seconds}s` })

function FeatureCard({ title, text, icon: Icon, wide, links, delay }: Feature & { delay: number }) {
  return (
    <section
      style={delayed(delay)}
      className={cn(
        'flex flex-col gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/20',
        RISE,
        wide && 'md:col-span-2',
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted" aria-hidden>
          <Icon className="size-4.5" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
      <ul className={cn('mt-auto grid gap-1', wide && 'md:grid-cols-2')}>
        {links.map(({ to, label, hint }) => (
          <li key={to} className="min-w-0">
            <Link
              to={to}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function HomePage() {
  const user = useCurrentUser()

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-10 md:py-14">
        <section className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_18rem] lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="order-first h-56 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-1000 md:order-last md:h-80 lg:h-84">
            <OrderRing />
          </div>
          <div className="flex flex-col items-start gap-4">
            <p style={delayed(0.1)} className={cn('text-sm text-muted-foreground', RISE)}>
              {t('home.greeting', { name: user.name.trim().split(/\s+/)[0] })}
            </p>
            <h2 style={delayed(0.2)} className={cn('text-3xl font-semibold tracking-tight text-balance md:text-5xl', RISE)}>
              {t('home.headline')}
            </h2>
            <p style={delayed(0.35)} className={cn('max-w-2xl text-base text-pretty text-muted-foreground md:text-lg', RISE)}>
              {t('home.intro')}
            </p>
            <div style={delayed(0.5)} className={cn('flex flex-wrap gap-2 pt-1', RISE)}>
              <Button asChild size="lg">
                <Link to="/diary/zen">
                  <Sparkles />
                  {t('home.writeDiary')}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/tasks/zen">{t('home.addTasks')}</Link>
              </Button>
            </div>
          </div>
        </section>

        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ title, text }, index) => (
            <li key={title} style={delayed(0.6 + index * 0.1)} className={cn('flex flex-col gap-1', RISE)}>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">{index + 1}</span>
              <span className="text-sm font-medium">{title}</span>
              <span className="text-sm text-muted-foreground">{text}</span>
            </li>
          ))}
        </ol>

        <div className="grid gap-4 md:grid-cols-2">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} delay={0.9 + index * 0.1} />
          ))}
        </div>
      </div>
    </div>
  )
}
