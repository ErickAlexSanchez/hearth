import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { FeedScreen } from '@/ui/feed-screen'
import { PreferencesProvider } from '@/ui/preferences'
import { createQueryClient } from '@/ui/providers'
import { createHearthStore, type HearthStore } from '@/ui/store'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

const user = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'jules@hearth.example',
  displayName: 'Jules Hart',
  tier: 'member' as const,
}

const post = {
  id: '33333333-3333-4333-8333-333333333331',
  body: 'Morning light on the table',
  visibility: 'public' as const,
  createdAt: '2026-10-22T12:00:00.000Z',
  author: { id: user.id, displayName: user.displayName },
}

function renderFeed(): HearthStore {
  const store = createHearthStore()
  render(
    <Provider store={store}>
      <QueryClientProvider client={createQueryClient()}>
        <PreferencesProvider>
          <FeedScreen />
        </PreferencesProvider>
      </QueryClientProvider>
    </Provider>,
  )
  return store
}

function requestPath(input: RequestInfo | URL): string {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  return new URL(url, 'http://localhost').pathname
}

function installFetch(handlers: Record<string, () => Response | Promise<Response>>): void {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const handler = handlers[requestPath(input)]
    if (!handler) throw new Error(`Unhandled fetch ${requestPath(input)}`)
    return handler()
  }) as typeof fetch
}

describe('feed screen', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('shows a loading state', async () => {
    globalThis.fetch = (() => new Promise<Response>(() => undefined)) as typeof fetch
    renderFeed()
    expect(await screen.findByText('Loading Hearth…')).toBeInTheDocument()
  })

  it('shows an empty state', async () => {
    installFetch({
      '/api/session': () => Response.json({ user }),
      '/api/feed': () => Response.json({ posts: [], nextCursor: null }),
    })
    renderFeed()
    expect(await screen.findByText('No posts yet. Write the first one.')).toBeInTheDocument()
  })

  it('shows an error state', async () => {
    installFetch({
      '/api/session': () => Response.json({ user }),
      '/api/feed': () => Response.json({ error: { message: 'nope' } }, { status: 500 }),
    })
    renderFeed()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the feed.')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('keeps the composer draft in redux and reads posts from the query', async () => {
    installFetch({
      '/api/session': () => Response.json({ user }),
      '/api/feed': () => Response.json({ posts: [post], nextCursor: null }),
    })
    const store = renderFeed()
    expect(await screen.findByText('Morning light on the table')).toBeInTheDocument()
    const actor = userEvent.setup()
    await actor.click(screen.getByRole('button', { name: 'Write a post' }))
    await actor.type(screen.getByLabelText('Post'), 'Walk today')
    await waitFor(() => {
      expect(store.getState()).toEqual({
        ui: { composerOpen: true, draft: 'Walk today' },
      })
    })
    expect(JSON.stringify(store.getState())).not.toContain('Morning light on the table')
  })
})
