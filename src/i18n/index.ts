import i18next from 'i18next'

import en from './en.json'
import ru from './ru.json'

export type Language = 'ru' | 'en'

const STORAGE_KEY = 'ordeus.language'

function storedLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'ru' || stored === 'en' ? stored : null
  } catch {
    return null
  }
}

// The choice made in the account, or else the browser's locale.
export const language: Language = storedLanguage() ?? (navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en')

// For Intl, which formats dates and sorts text.
export const locale = language === 'ru' ? 'ru-RU' : 'en-GB'

void i18next.init({
  lng: language,
  fallbackLng: 'en',
  resources: { ru: { translation: ru }, en: { translation: en } },
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  initAsync: false,
})

document.documentElement.lang = language

export const t = i18next.t.bind(i18next)

// A full reload is what repaints everything, including the dates and labels
// that modules format once when they load.
export function applyLanguage(next: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    return
  }
  window.location.reload()
}
