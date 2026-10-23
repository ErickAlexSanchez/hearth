'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { messages, type Locale, type Messages } from '@/ui/messages'
import { LOCALE_STORAGE_KEY, THEME_STORAGE_KEY } from '@/ui/preference-boot'

export type ThemeName = 'light' | 'dark'

type PreferencesValue = {
  locale: Locale
  theme: ThemeName
  setLocale: (locale: Locale) => void
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
}

const PreferencesContext = createContext<PreferencesValue | null>(null)

function readLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  return window.localStorage.getItem(LOCALE_STORAGE_KEY) === 'es' ? 'es' : 'en'
}

function systemTheme(): ThemeName {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function readTheme(): ThemeName {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return systemTheme()
}

function applyLocale(locale: Locale): void {
  document.documentElement.lang = locale
}

function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [theme, setThemeState] = useState<ThemeName>('light')
  const themeRef = useRef(theme)
  themeRef.current = theme

  useLayoutEffect(() => {
    const nextLocale = readLocale()
    const nextTheme = readTheme()
    setLocaleState(nextLocale)
    setThemeState(nextTheme)
    applyLocale(nextLocale)
    applyTheme(nextTheme)
  }, [])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    function onChange(): void {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') return
      const next = media.matches ? 'dark' : 'light'
      setThemeState(next)
      applyTheme(next)
    }
    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [])

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
    applyLocale(next)
    setLocaleState(next)
  }, [])

  const setTheme = useCallback((next: ThemeName) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, next)
    applyTheme(next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    const next = themeRef.current === 'dark' ? 'light' : 'dark'
    window.localStorage.setItem(THEME_STORAGE_KEY, next)
    applyTheme(next)
    setThemeState(next)
  }, [])

  const value = useMemo(
    () => ({ locale, theme, setLocale, setTheme, toggleTheme }),
    [locale, theme, setLocale, setTheme, toggleTheme],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences(): PreferencesValue {
  const value = useContext(PreferencesContext)
  if (!value) throw new Error('usePreferences must be used within PreferencesProvider.')
  return value
}

export function useCopy(): Messages {
  const { locale } = usePreferences()
  return messages[locale]
}

export function SkipLink() {
  const copy = useCopy()
  return (
    <a className="skip" href="#main">
      {copy.skip}
    </a>
  )
}
