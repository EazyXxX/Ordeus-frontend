import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { List, Minus, Plus, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import '@fontsource-variable/literata'
import '@fontsource-variable/literata/wght-italic.css'

import { locale, t } from '@/i18n'
import { useCurrentUser } from '@/app/account/session'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { parseLocalDate, weekLabel } from '@/lib/dates'
import * as api from './api'
import { LIBRARY_KEY, SUMMARIES_KEY, type Summary } from './api'
import { buildBook, type BookDay } from './book-data'
import { DayDialog } from './DayDialog'
import { DayMark } from './DayMark'
import { ScoreBars } from './ScoreBars'
import { useDays } from './useDays'

const FONT_KEY = 'ordeus.book.fontSize'
const PLACE_KEY = 'ordeus.book.day'
const FONT_SIZES = { min: 15, max: 24, initial: 18 }
const SERIF = '"Literata Variable", Georgia, serif'

const dayFormat = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' })
const rangeFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })

// Storage can be blocked, and the book reads fine without it.
function remembered(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // The place in the book is simply forgotten.
  }
}

function DayEntry({ value, onMark }: { value: BookDay; onMark: () => void }) {
  const { date, notes, day } = value
  const paragraphs = (body: string) => body.split(/\n+/).filter(Boolean)

  return (
    <section data-book-day={date} className="flex flex-col gap-5 scroll-mt-20">
      <header className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-[0.8em] tracking-wide text-muted-foreground first-letter:uppercase">
          {dayFormat.format(parseLocalDate(date))}
        </h3>
        <DayMark day={day} onClick={onMark} />
      </header>

      {notes.map((note, noteIndex) => (
        <article key={note.id} className="flex flex-col gap-3">
          <h4 className="text-[1.15em] leading-snug font-semibold">{note.title}</h4>
          {paragraphs(note.body).map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0 && noteIndex === 0
                  ? 'leading-[1.75] text-pretty first-letter:float-left first-letter:mr-2 first-letter:text-[3.2em] first-letter:leading-[0.9] first-letter:font-semibold'
                  : 'leading-[1.75] text-pretty'
              }
            >
              {paragraph}
            </p>
          ))}
        </article>
      ))}

      {day?.summary && (
        <aside className="border-l-2 pl-4 text-[0.92em] leading-relaxed text-muted-foreground italic">
          <p className="mb-1 font-sans text-xs not-italic">{t('book.daySummary')}</p>
          <p className="whitespace-pre-line">{day.summary}</p>
          {day.focus && <p className="mt-2">{t('journal.tomorrow', { text: day.focus })}</p>}
        </aside>
      )}
    </section>
  )
}

function WeekEntry({ summary }: { summary: Summary }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-6">
      <p className="font-sans text-xs text-muted-foreground">{t('book.weekSummary', { week: weekLabel(summary.week) })}</p>
      {summary.headline && <h3 className="text-[1.3em] leading-snug font-semibold text-balance">{summary.headline}</h3>}
      <p className="leading-relaxed text-pretty">{summary.text}</p>
      {summary.highlights.length > 0 && (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-[0.95em]">
          {summary.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      )}
      {summary.focus && <p className="text-[0.95em] text-muted-foreground italic">{summary.focus}</p>}
    </section>
  )
}

const Ornament = () => (
  <p aria-hidden className="text-center tracking-[0.6em] text-muted-foreground">
    ···
  </p>
)

export function DiaryBook() {
  const navigate = useNavigate()
  const user = useCurrentUser()
  const scroller = useRef<HTMLDivElement>(null)
  const restored = useRef(false)
  const [progress, setProgress] = useState(0)
  const [contentsOpen, setContentsOpen] = useState(false)
  const [markedDay, setMarkedDay] = useState<string | null>(null)
  const [fontSize, setFontSize] = useState(() => Number(remembered(FONT_KEY)) || FONT_SIZES.initial)

  const notes = useQuery({
    queryKey: [...LIBRARY_KEY, 'notes', 'book'],
    queryFn: () => api.fetchNotes({ daily: 'true' }),
  })
  const summaries = useQuery({ queryKey: SUMMARIES_KEY, queryFn: api.fetchSummaries })
  const { byDate: days, isPending: daysPending } = useDays()

  const book = useMemo(
    () => buildBook(notes.data ?? [], days, summaries.data ?? []),
    [notes.data, days, summaries.data],
  )
  const ready = !notes.isPending && !daysPending && !summaries.isPending
  const months = book.items.flatMap((item) => (item.type === 'month' ? [item] : []))
  const scores = book.dates.flatMap((date) => days.get(date)?.score ?? [])
  const noteCount = book.items.reduce((count, item) => count + (item.type === 'day' ? item.value.notes.length : 0), 0)
  const firstDate = book.dates[0]
  const lastDate = book.dates[book.dates.length - 1]

  useEffect(() => {
    function close(event: KeyboardEvent) {
      if (event.key === 'Escape' && !document.querySelector('[role=dialog]')) navigate('/diary/journal')
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [navigate])

  function goTo(selector: string) {
    setContentsOpen(false)
    scroller.current?.querySelector(selector)?.scrollIntoView()
  }

  // Opens where the reader stopped.
  useEffect(() => {
    if (!ready || restored.current || book.dates.length === 0) return
    restored.current = true
    const place = remembered(PLACE_KEY)
    if (place) scroller.current?.querySelector(`[data-book-day="${place}"]`)?.scrollIntoView()
  }, [ready, book.dates.length])

  function track() {
    const element = scroller.current
    if (!element) return
    const reachable = element.scrollHeight - element.clientHeight
    setProgress(reachable > 0 ? element.scrollTop / reachable : 0)
    const top = element.getBoundingClientRect().top
    const current = [...element.querySelectorAll<HTMLElement>('[data-book-day]')].findLast(
      (section) => section.getBoundingClientRect().top - top < element.clientHeight / 2,
    )
    if (current?.dataset.bookDay) remember(PLACE_KEY, current.dataset.bookDay)
  }

  function changeFont(step: number) {
    const next = Math.min(FONT_SIZES.max, Math.max(FONT_SIZES.min, fontSize + step))
    setFontSize(next)
    remember(FONT_KEY, String(next))
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <div aria-hidden className="h-0.5 shrink-0 bg-muted">
        <div className="h-full bg-foreground/60" style={{ width: `${progress * 100}%` }} />
      </div>
      <header className="flex shrink-0 items-center gap-1 border-b px-2 py-1.5">
        <Button asChild variant="ghost" size="icon" aria-label={t('book.close')}>
          <Link to="/diary/journal">
            <X />
          </Link>
        </Button>
        <p className="min-w-0 flex-1 truncate px-1 text-sm font-medium">{t('book.title')}</p>
        <Button variant="ghost" size="icon" aria-label={t('book.smaller')} onClick={() => changeFont(-1)}>
          <Minus />
        </Button>
        <Button variant="ghost" size="icon" aria-label={t('book.larger')} onClick={() => changeFont(1)}>
          <Plus />
        </Button>
        <Button variant="ghost" size="icon" aria-label={t('book.contents')} onClick={() => setContentsOpen(true)}>
          <List />
        </Button>
      </header>

      <div ref={scroller} onScroll={track} className="min-h-0 flex-1 overflow-y-auto">
        <div style={{ fontFamily: SERIF, fontSize }} className="mx-auto flex w-full max-w-2xl flex-col gap-12 px-5 py-14">
          {!ready && <p className="text-center text-muted-foreground">{t('book.opening')}</p>}

          {ready && book.dates.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-muted-foreground">{t('book.empty')}</p>
              <Button asChild variant="outline" style={{ fontFamily: 'var(--font-sans)' }}>
                <Link to="/diary/zen">{t('book.write')}</Link>
              </Button>
            </div>
          )}

          {firstDate && (
            <header className="flex flex-col items-center gap-3 py-10 text-center">
              <h1 className="text-[2.4em] leading-tight font-semibold text-balance">
                {t('book.story', { name: user.name.trim().split(/\s+/)[0] })}
              </h1>
              <p className="text-muted-foreground">
                {rangeFormat.formatRange(parseLocalDate(firstDate), parseLocalDate(lastDate))}
              </p>
              <p className="font-sans text-sm text-muted-foreground">
                {t('book.stats', { days: book.dates.length, notes: noteCount })}
                {scores.length > 0 &&
                  t('book.average', {
                    average: (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1),
                  })}
              </p>
            </header>
          )}

          {book.items.map((item, index) => {
            if (item.type === 'month') {
              return (
                <section key={item.key} data-book-month={item.key} className="flex flex-col gap-5 pt-8 scroll-mt-20">
                  <h2 className="text-center text-[1.8em] font-semibold">{item.title}</h2>
                  <div className="font-sans">
                    <ScoreBars dates={item.dates} days={days} onSelect={setMarkedDay} />
                  </div>
                </section>
              )
            }
            if (item.type === 'week') return <WeekEntry key={item.key} summary={item.summary} />
            const previous = book.items[index - 1]
            return (
              <div key={item.key} className="flex flex-col gap-12">
                {previous?.type === 'day' && <Ornament />}
                <DayEntry value={item.value} onMark={() => setMarkedDay(item.value.date)} />
              </div>
            )
          })}
        </div>
      </div>

      <Sheet open={contentsOpen} onOpenChange={setContentsOpen}>
        <SheetContent side="right" className="z-50 gap-0 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('book.contents')}</SheetTitle>
            <SheetDescription className="sr-only">{t('book.goToMonth')}</SheetDescription>
          </SheetHeader>
          <ul className="flex flex-col gap-1 p-2">
            {months.map((month) => (
              <li key={month.key}>
                <button
                  type="button"
                  onClick={() => goTo(`[data-book-month="${month.key}"]`)}
                  className="w-full rounded-md px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {month.title}
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      {markedDay && <DayDialog date={markedDay} onClose={() => setMarkedDay(null)} />}
    </div>
  )
}
