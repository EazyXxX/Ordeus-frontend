import { useEffect, useState } from 'react'

export const THEMES = ['light', 'dark', 'system', 'beige', 'midnight', 'acid'] as const
export type Theme = (typeof THEMES)[number]

// Colored themes are built on light or dark. index.html keeps its own copy of
// this list, for the first paint.
const DARK_THEMES: Theme[] = ['dark', 'midnight', 'acid']
const COLORED_THEMES = ['beige', 'midnight', 'acid'] as const

// index.html reads this key too, so the first paint has the right theme.
const STORAGE_KEY = 'ordeus.theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function isTheme(value: string | null): value is Theme {
  return THEMES.some((theme) => theme === value)
}

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isTheme(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

function writeTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // The theme still applies for this visit without being remembered.
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const dark = DARK_THEMES.includes(theme) || (theme === 'system' && matchMedia(DARK_QUERY).matches)
  root.classList.toggle('dark', dark)
  for (const colored of COLORED_THEMES) root.classList.toggle(`theme-${colored}`, theme === colored)
}

export function useTheme() {
  const [theme, setTheme] = useState(readTheme)

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return

    const media = matchMedia(DARK_QUERY)
    const follow = () => applyTheme('system')
    media.addEventListener('change', follow)
    return () => media.removeEventListener('change', follow)
  }, [theme])

  function changeTheme(next: Theme) {
    writeTheme(next)
    setTheme(next)
  }

  return { theme, changeTheme }
}
