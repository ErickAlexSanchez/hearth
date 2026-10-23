import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { DEMO_MEMBERS_POST_URL } from '@/ui/messages'
import { LOCALE_STORAGE_KEY, THEME_STORAGE_KEY } from '@/ui/preference-boot'
import { HeaderControls } from '@/ui/header-controls'
import { PreferencesProvider } from '@/ui/preferences'
import { createQueryClient } from '@/ui/providers'
import { Shell } from '@/ui/shell'
import { createHearthStore } from '@/ui/store'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

function renderControls(): void {
  render(
    <PreferencesProvider>
      <header>
        <HeaderControls />
        <a href="/outside">Outside</a>
      </header>
    </PreferencesProvider>,
  )
}

function preferDark(): void {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('prefers-color-scheme: dark'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

describe('header controls', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('places help, language, and theme in the site header', async () => {
    globalThis.fetch = (async () => Response.json({ user: null })) as typeof fetch
    render(
      <Provider store={createHearthStore()}>
        <QueryClientProvider client={createQueryClient()}>
          <PreferencesProvider>
            <Shell>
              <p>Feed body</p>
            </Shell>
          </PreferencesProvider>
        </QueryClientProvider>
      </Provider>,
    )
    const header = await screen.findByRole('banner')
    expect(header).toContainElement(screen.getByRole('button', { name: 'About this demo' }))
    expect(header).toContainElement(screen.getByRole('button', { name: 'English' }))
    expect(header).toContainElement(screen.getByRole('button', { name: 'Spanish' }))
    expect(header).toContainElement(screen.getByRole('button', { name: 'Switch to dark theme' }))
  })

  it('traps focus, closes on Escape, and restores focus', async () => {
    renderControls()
    const actor = userEvent.setup()
    const help = screen.getByRole('button', { name: 'About this demo' })
    await actor.click(help)
    const dialog = screen.getByRole('dialog', { name: 'About this demo' })
    expect(dialog).toHaveFocus()
    expect(dialog).toHaveTextContent('What this app is')
    expect(dialog).toHaveTextContent('Case study')
    expect(dialog).toHaveTextContent('portfolio version of a confidential product')
    expect(dialog).toHaveTextContent('fictional brand')
    expect(dialog).toHaveTextContent('Architecture and why')
    expect(dialog).toHaveTextContent('modular monolith')
    expect(dialog).toHaveTextContent('Postgres is the source of truth')
    expect(dialog).toHaveTextContent('Entitlements are checked on the server')
    expect(dialog).toHaveTextContent('coach schema is isolated from the feed')
    expect(dialog).toHaveTextContent('shorter retention')
    expect(dialog).toHaveTextContent('TanStack Query owns the paginated feed')
    expect(dialog).toHaveTextContent('Redux stores only UI state')
    expect(dialog).toHaveTextContent('Cache-Control: no-store')
    expect(dialog).toHaveTextContent('DATABASE_READ_URL')
    expect(dialog).toHaveTextContent('Demo access and how to try it')
    expect(dialog).toHaveTextContent(
      'jules@hearth.example / hearth-demo-member is a member and can publish a members-only post.',
    )
    expect(dialog).toHaveTextContent('mira@hearth.example / hearth-demo-free is free.')
    expect(dialog).toHaveTextContent(`${DEMO_MEMBERS_POST_URL} returns the locked state for Mira.`)
    expect(dialog).toHaveTextContent('not medical advice')

    const postLink = screen.getByRole('link', { name: DEMO_MEMBERS_POST_URL })
    const close = screen.getByRole('button', { name: 'Close' })
    await actor.tab()
    expect(postLink).toHaveFocus()
    await actor.tab()
    expect(close).toHaveFocus()
    await actor.tab()
    expect(postLink).toHaveFocus()
    expect(screen.getByRole('link', { name: 'Outside' })).not.toHaveFocus()
    await actor.tab({ shift: true })
    expect(close).toHaveFocus()

    await actor.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(help).toHaveFocus()
  })

  it('stores the locale and translates the dialog', async () => {
    renderControls()
    const actor = userEvent.setup()
    await actor.click(screen.getByRole('button', { name: 'Spanish' }))
    expect(document.documentElement.lang).toBe('es')
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('es')
    await actor.click(screen.getByRole('button', { name: 'Acerca de esta demo' }))
    const dialog = screen.getByRole('dialog', { name: 'Acerca de esta demo' })
    expect(dialog).toHaveTextContent('Qué es esta aplicación')
    expect(dialog).toHaveTextContent('Caso de estudio')
    expect(dialog).toHaveTextContent('marca ficticia')
    expect(dialog).toHaveTextContent('Arquitectura y por qué')
    expect(dialog).toHaveTextContent('monolito modular')
    expect(dialog).toHaveTextContent('Postgres es la fuente de verdad')
    expect(dialog).toHaveTextContent('entitlements se comprueban en el servidor')
    expect(dialog).toHaveTextContent('esquema del coach está aislado del feed')
    expect(dialog).toHaveTextContent('retención más corta')
    expect(dialog).toHaveTextContent('TanStack Query pagina el feed')
    expect(dialog).toHaveTextContent('Redux guarda solo el estado de la interfaz')
    expect(dialog).toHaveTextContent('Cache-Control: no-store')
    expect(dialog).toHaveTextContent('DATABASE_READ_URL')
    expect(dialog).toHaveTextContent('Acceso a la demo y cómo probarla')
    expect(dialog).toHaveTextContent(
      'jules@hearth.example / hearth-demo-member es miembro y puede publicar una nota solo para miembros.',
    )
    expect(dialog).toHaveTextContent('mira@hearth.example / hearth-demo-free es gratis.')
    expect(dialog).toHaveTextContent('estado bloqueado para Mira')
    expect(dialog).toHaveTextContent('no es consejo médico')
    expect(dialog).toHaveTextContent('No diagnostica y no sugiere una dosis.')
  })

  it('follows the system theme until a choice is stored', async () => {
    preferDark()
    renderControls()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    const actor = userEvent.setup()
    await actor.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    await actor.click(screen.getByRole('button', { name: 'Switch to dark theme' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('keeps a stored theme ahead of the system preference', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light')
    preferDark()
    renderControls()
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })
})
