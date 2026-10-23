import { POST as signIn } from '@/app/api/auth/login/route'
import { GET as readFeed, POST as publish } from '@/app/api/feed/route'
import { GET as readOne } from '@/app/api/feed/[id]/route'
import { GET as readCoach } from '@/app/api/coach/messages/route'
import { GET as readHealth } from '@/app/api/health/route'
import { readFeed as readFeedPage } from '@/application/feed/read-feed'
import { closeContainer, createAppContainer } from '@/composition/container'
import {
  DEMO_FREE_EMAIL,
  DEMO_FREE_PASSWORD,
  DEMO_MEMBER_EMAIL,
  DEMO_MEMBER_ID,
  DEMO_MEMBER_PASSWORD,
  DEMO_MEMBERS_POST_BODY,
  DEMO_MEMBERS_POST_ID,
  DEMO_PUBLIC_POST_BODY,
} from '@/composition/demo-catalog'

describe('in-memory catalog', () => {
  const previous = {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_READ_URL: process.env.DATABASE_READ_URL,
  }

  beforeEach(async () => {
    delete process.env.DATABASE_URL
    delete process.env.DATABASE_READ_URL
    await closeContainer()
  })

  afterEach(async () => {
    await closeContainer()
    restore('DATABASE_URL', previous.DATABASE_URL)
    restore('DATABASE_READ_URL', previous.DATABASE_READ_URL)
  })

  it('does not open Postgres when the database urls are blank', async () => {
    const container = createAppContainer({ DATABASE_URL: '  ', DATABASE_READ_URL: '' })
    expect(container.env.DATABASE_URL).toBeNull()
    expect(container.env.DATABASE_READ_URL).toBeNull()
    await container.close()
  })

  it('keeps the Postgres environment check when a database url is set', () => {
    expect(() =>
      createAppContainer({
        DATABASE_URL: 'postgres://hearth:hearth@127.0.0.1:5434/hearth',
        SESSION_SECRET: 'super-secret-value-here',
      }),
    ).toThrow(/Incomplete environment/)
    try {
      createAppContainer({
        DATABASE_URL: 'postgres://hearth:hearth@127.0.0.1:5434/hearth',
        SESSION_SECRET: 'super-secret-value-here',
      })
      throw new Error('expected createAppContainer to throw')
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      expect(message).toMatch(/Incomplete environment/)
      expect(message).not.toContain('super-secret-value-here')
      expect(message).not.toContain('hearth:hearth')
    }
  })

  it('serves the seeded feed without a database', async () => {
    const container = createAppContainer({})
    const first = await readFeedPage(container, { userId: DEMO_MEMBER_ID, cursor: null, limit: 1 })
    expect(first.posts[0]?.id).toBe(DEMO_MEMBERS_POST_ID)
    expect(first.posts[0]?.body).toBe(DEMO_MEMBERS_POST_BODY)
    expect(first.nextCursor).toEqual(expect.any(String))
    const second = await readFeedPage(container, {
      userId: DEMO_MEMBER_ID,
      cursor: first.nextCursor,
      limit: 1,
    })
    expect(second.posts[0]?.id).not.toBe(DEMO_MEMBERS_POST_ID)
    await container.close()
  })

  it('signs the demo accounts in without Postgres and keeps entitlement on the server', async () => {
    const health = await readHealth(new Request('http://127.0.0.1:3301/api/health'))
    expect(health.status).toBe(200)

    const jules = await login(DEMO_MEMBER_EMAIL, DEMO_MEMBER_PASSWORD)
    expect(jules.status).toBe(200)
    const julesCookie = cookieFrom(jules)
    await closeContainer()

    const allowed = await readOne(authed(`/api/feed/${DEMO_MEMBERS_POST_ID}`, julesCookie), {
      params: Promise.resolve({ id: DEMO_MEMBERS_POST_ID }),
    })
    const allowedText = await allowed.text()
    expect(allowed.status).toBe(200)
    expect(allowedText).toContain(DEMO_MEMBERS_POST_BODY)

    const julesFeed = await readFeed(authed('/api/feed', julesCookie))
    const julesFeedText = await julesFeed.text()
    expect(julesFeed.status).toBe(200)
    expect(julesFeedText).toContain(DEMO_MEMBERS_POST_BODY)
    expect(julesFeedText).toContain(DEMO_PUBLIC_POST_BODY)

    const julesCoach = await readCoach(authed('/api/coach/messages', julesCookie))
    expect(julesCoach.status).toBe(200)

    const mira = await login(DEMO_FREE_EMAIL, DEMO_FREE_PASSWORD)
    expect(mira.status).toBe(200)
    const miraBody: unknown = await mira.json()
    expect(miraBody).toMatchObject({ user: { email: DEMO_FREE_EMAIL, tier: 'free' } })
    const miraCookie = cookieFrom(mira)
    await closeContainer()

    const forbidden = await readOne(authed(`/api/feed/${DEMO_MEMBERS_POST_ID}`, miraCookie), {
      params: Promise.resolve({ id: DEMO_MEMBERS_POST_ID }),
    })
    const forbiddenText = await forbidden.text()
    expect(forbidden.status).toBe(403)
    expect(forbiddenText).not.toContain(DEMO_MEMBERS_POST_BODY)

    const miraFeed = await readFeed(authed('/api/feed', miraCookie))
    const miraFeedText = await miraFeed.text()
    expect(miraFeed.status).toBe(200)
    expect(miraFeedText).not.toContain(DEMO_MEMBERS_POST_BODY)
    expect(miraFeedText).toContain(DEMO_PUBLIC_POST_BODY)

    const denied = await publish(
      authed('/api/feed', miraCookie, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: DEMO_MEMBERS_POST_BODY, visibility: 'members' }),
      }),
    )
    const deniedText = await denied.text()
    expect(denied.status).toBe(403)
    expect(deniedText).not.toContain(DEMO_MEMBERS_POST_BODY)

    const miraCoach = await readCoach(authed('/api/coach/messages', miraCookie))
    expect(miraCoach.status).toBe(200)

    const tampered = `${julesCookie}x`
    const rejected = await readOne(authed(`/api/feed/${DEMO_MEMBERS_POST_ID}`, tampered), {
      params: Promise.resolve({ id: DEMO_MEMBERS_POST_ID }),
    })
    expect(rejected.status).toBe(401)
  })
})

function restore(key: 'DATABASE_URL' | 'DATABASE_READ_URL', value: string | undefined): void {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

function login(email: string, password: string): Promise<Response> {
  return signIn(
    new Request('http://127.0.0.1:3301/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),
  )
}

function authed(path: string, cookie: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers)
  headers.set('cookie', cookie)
  return new Request(`http://127.0.0.1:3301${path}`, { ...init, headers })
}

function cookieFrom(response: Response): string {
  const header = response.headers.get('set-cookie')
  const pair = header?.split(';')[0]
  if (!pair?.startsWith('hearth_session=')) throw new Error('missing session cookie')
  return pair
}
