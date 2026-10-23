import '@testing-library/jest-dom'
import { fetch, Headers, Request, Response } from 'undici'

Object.assign(globalThis, { fetch, Headers, Request, Response })

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.lang = 'en'
  delete document.documentElement.dataset.theme
  document.documentElement.style.colorScheme = ''
  document.body.style.overflow = ''
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
})
