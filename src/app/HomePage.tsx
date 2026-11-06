import { ArrowRight, BookOpen, CalendarDays, KanbanSquare, Sparkles, UserRound, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

import { useCurrentUser } from '@/app/account/session'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STEPS = [
  { title: 'Выгрузите всё из головы', text: 'Пишите или надиктовывайте как думается, без папок и форматирования.' },
  { title: 'Нейросеть разложит по полочкам', text: 'Заголовки, папки, теги, связи и задачи с датами появятся сами.' },
  { title: 'Вернитесь, когда нужно', text: 'Записи, доска и календарь уже в порядке, всё остальное можно поправить вручную.' },
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
    text: 'Заметки, которые сами находят своё место и связываются друг с другом.',
    icon: BookOpen,
    wide: true,
    links: [
      { to: '/diary/zen', label: 'Дзен', hint: 'Текст или голос, остальное сделает нейросеть' },
      { to: '/diary', label: 'Записи', hint: 'Папки, теги, эмодзи и поиск' },
      { to: '/diary?daily', label: 'Ежедневник', hint: 'Ваши дни с поиском по датам' },
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

function FeatureCard({ title, text, icon: Icon, wide, links }: Feature) {
  return (
    <section className={cn('flex flex-col gap-4 rounded-xl border bg-card p-5', wide && 'md:col-span-2')}>
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
        <section className="flex flex-col items-start gap-4">
          <p className="text-sm text-muted-foreground">Привет, {user.name.trim().split(/\s+/)[0]}</p>
          <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-5xl">Порядок в голове и в делах</h2>
          <p className="max-w-2xl text-base text-pretty text-muted-foreground md:text-lg">
            Ordeus, от латинского ordo, «порядок». Дневник, задачи и календарь в одном месте: вы просто записываете, что
            пришло в голову, а нейросеть раскладывает всё по полочкам.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
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
        </section>

        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ title, text }, index) => (
            <li key={title} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground tabular-nums">{index + 1}</span>
              <span className="text-sm font-medium">{title}</span>
              <span className="text-sm text-muted-foreground">{text}</span>
            </li>
          ))}
        </ol>

        <div className="grid gap-4 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </div>
  )
}
