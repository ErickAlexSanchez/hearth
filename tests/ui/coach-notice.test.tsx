import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { CoachScreen } from '@/ui/coach-screen'
import { PreferencesProvider } from '@/ui/preferences'
import { createQueryClient } from '@/ui/providers'
import { createHearthStore } from '@/ui/store'

jest.mock('next/navigation', () => ({
  usePathname: () => '/coach',
}))

const user = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'jules@hearth.example',
  displayName: 'Jules Hart',
  tier: 'member' as const,
}

function requestPath(input: RequestInfo | URL): string {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  return new URL(url, 'http://localhost').pathname
}

function renderCoach(): void {
  render(
    <Provider store={createHearthStore()}>
      <QueryClientProvider client={createQueryClient()}>
        <PreferencesProvider>
          <CoachScreen />
        </PreferencesProvider>
      </QueryClientProvider>
    </Provider>,
  )
}

describe('coach notice', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('stays visible while habit notes are loading, empty, and failing', async () => {
    let resolveNotes: (response: Response) => void = () => undefined
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const path = requestPath(input)
      if (path === '/api/session') return Response.json({ user })
      if (path === '/api/coach/messages') {
        return new Promise<Response>((resolve) => {
          resolveNotes = resolve
        })
      }
      throw new Error(`Unhandled fetch ${path}`)
    }) as typeof fetch

    renderCoach()
    expect(await screen.findByText('Loading your habit notes…')).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent(/not medical advice/i)

    resolveNotes(Response.json({ messages: [] }))
    expect(await screen.findByText(/No habit notes yet/i)).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent(/not medical advice/i)
  })

  it('stays visible when habit notes fail to load', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const path = requestPath(input)
      if (path === '/api/session') return Response.json({ user })
      if (path === '/api/coach/messages') return Response.json({ error: { message: 'nope' } }, { status: 500 })
      throw new Error(`Unhandled fetch ${path}`)
    }) as typeof fetch

    renderCoach()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your habit notes.')
    expect(screen.getByRole('note')).toHaveTextContent(/not medical advice/i)
  })

  it('shows the same habit boundary in Spanish', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const path = requestPath(input)
      if (path === '/api/session') return Response.json({ user })
      if (path === '/api/coach/messages') return Response.json({ messages: [] })
      throw new Error(`Unhandled fetch ${path}`)
    }) as typeof fetch

    renderCoach()
    const actor = userEvent.setup()
    await actor.click(await screen.findByRole('button', { name: 'Spanish' }))
    const note = screen.getByRole('note')
    expect(note).toHaveTextContent(/no es consejo médico/i)
    expect(note).toHaveTextContent(/no diagnostica/i)
    expect(note).toHaveTextContent(/ni sugiere una dosis/i)
    expect(note).not.toHaveTextContent(/milligram|mg\b|prescription/i)
    expect(document.documentElement.lang).toBe('es')
  })
})
