import { ArrowRight, BookOpen, CalendarDays, KanbanSquare, Sparkles, UserRound, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

import { useCurrentUser } from '@/app/account/session'
import { OrderRing } from '@/app/OrderRing'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STEPS = [
  { title: 'Выгрузите всё из головы', text: 'Пишите или надиктовывайте как думается, без папок и форматирования.' },
  { title: 'Нейросеть разложит по полочкам', text: 'Заголовки, папки, теги, связи и задачи с датами появятся сами.' },
  { title: 'Смотрите на жизнь как на историю', text: 'Оценки дней, итоги недель и советы складываются в книгу о вас.' },
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
    title: 'Дневник',
    text: 'Записи сами находят своё место, а дни складываются в историю с итогами и настроением.',
    icon: BookOpen,
    wide: true,
    links: [
      { to: '/diary/journal', label: 'Ежедневник', hint: 'Эмоции, оценка дня, итоги и советы нейросети' },
      { to: '/diary/book', label: 'Книга', hint: 'Все дни единым рассказом на весь экран' },
      { to: '/diary/zen', label: 'Дзен', hint: 'Текст или голос, остальное сделает нейросеть' },
      { to: '/diary', label: 'Записи', hint: 'Папки, теги, эмодзи и поиск' },
      { to: '/diary/graph', label: 'Граф', hint: 'Карта связей между записями' },
    ],
  },
  {
    title: 'Задачи',
    text: 'Доска с приоритетами, сроками, чек-листами и бэклогом.',
    icon: KanbanSquare,
    links: [
      { to: '/tasks/zen', label: 'Дзен', hint: 'Опишите дела, тикеты появятся сами' },
      { to: '/tasks', label: 'Канбан', hint: 'Перетаскивайте карточки по колонкам' },
      { to: '/tasks/list', label: 'Список', hint: 'Все задачи одной таблицей' },
    ],
  },
  {
    title: 'Календарь',
    text: 'Месяц и неделя на одном экране: задачи со сроками и заметки на конкретные даты.',
    icon: CalendarDays,
    links: [{ to: '/calendar', label: 'Открыть календарь', hint: 'Планируйте по дням и неделям' }],
  },
  {
    title: 'Личный кабинет',
    text: 'Несколько аккаунтов и выбор нейросети: локальная на вашем компьютере или удалённая по API.',
    icon: UserRound,
    wide: true,
    links: [{ to: '/account', label: 'Открыть кабинет', hint: 'Профиль, аккаунты и настройки нейросети' }],
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
              Привет, {user.name.trim().split(/\s+/)[0]}
            </p>
            <h2 style={delayed(0.2)} className={cn('text-3xl font-semibold tracking-tight text-balance md:text-5xl', RISE)}>
              Порядок в голове и в делах
            </h2>
            <p style={delayed(0.35)} className={cn('max-w-2xl text-base text-pretty text-muted-foreground md:text-lg', RISE)}>
              Ordeus, от латинского ordo, «порядок». Дневник, задачи и календарь в одном месте: вы записываете, что пришло
              в голову, а нейросеть раскладывает всё по полочкам и подводит итоги дней и недель.
            </p>
            <div style={delayed(0.5)} className={cn('flex flex-wrap gap-2 pt-1', RISE)}>
              <Button asChild size="lg">
                <Link to="/diary/zen">
                  <Sparkles />
                  Написать в дневник
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/tasks/zen">Накидать задачи</Link>
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
