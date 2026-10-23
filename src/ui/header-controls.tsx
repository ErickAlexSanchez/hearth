'use client'

import { useCallback, useId, useState } from 'react'
import { DemoDialog } from '@/ui/demo-dialog'
import { useCopy, usePreferences } from '@/ui/preferences'

export function HeaderControls() {
  const { locale, setLocale, theme, toggleTheme } = usePreferences()
  const copy = useCopy()
  const dialogId = useId()
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const close = useCallback(() => {
    setOpen(false)
  }, [])
  const themeLabel = theme === 'dark' ? copy.switchToLight : copy.switchToDark

  return (
    <div className="header-controls">
      <button
        type="button"
        className="icon-button"
        aria-label={copy.aboutName}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onClick={() => {
          setOpen(true)
        }}
      >
        ?
      </button>
      <div className="locale-switch" role="group" aria-label={copy.language}>
        <button type="button" aria-pressed={locale === 'en'} aria-label={copy.english} onClick={() => setLocale('en')}>
          EN
        </button>
        <button type="button" aria-pressed={locale === 'es'} aria-label={copy.spanish} onClick={() => setLocale('es')}>
          ES
        </button>
      </div>
      <button type="button" className="icon-button" aria-label={themeLabel} aria-pressed={theme === 'dark'} onClick={toggleTheme}>
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
      {open ? <DemoDialog copy={copy} onClose={close} dialogId={dialogId} titleId={titleId} /> : null}
    </div>
  )
}

function SunIcon() {
  return (
    <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M15.2 3.4a8.2 8.2 0 1 0 5.4 12.5A6.8 6.8 0 0 1 15.2 3.4z" />
    </svg>
  )
}
