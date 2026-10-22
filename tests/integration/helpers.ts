import { POST as signUp } from '@/app/api/auth/signup/route'
import { getContainer } from '@/composition/container'

export async function signUpUser(displayName = 'Test User'): Promise<{ userId: string; cookie: string }> {
  const email = `user-${crypto.randomUUID()}@hearth.test`
  const response = await signUp(
    new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'correct-horse',
        displayName,
      }),
    }),
  )
  const text = await response.text()
  if (response.status !== 201) {
    throw new Error(`signup failed ${response.status} ${text}`)
  }
  const payload: unknown = JSON.parse(text)
  return { userId: readUserId(payload), cookie: cookieFrom(response) }
}

export async function removeUser(userId: string): Promise<void> {
  await getContainer().identity.deleteUser(userId)
}

export function authed(path: string, cookie: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers)
  headers.set('cookie', cookie)
  return new Request(`http://localhost${path}`, { ...init, headers })
}

export async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()
  try {
    return JSON.parse(text) as unknown
  } catch (error) {
    if (error instanceof SyntaxError) return text
    throw error
  }
}

function cookieFrom(response: Response): string {
  const cookies = readSetCookies(response.headers)
  const match = cookies.find((value) => value.startsWith('hearth_session='))
  const pair = match?.split(';')[0]
  if (!pair) throw new Error('missing session cookie')
  return pair
}

function readSetCookies(headers: Headers): string[] {
  const withGetter = headers as Headers & { getSetCookie?: () => string[] }
  if (typeof withGetter.getSetCookie === 'function') return withGetter.getSetCookie()
  const single = headers.get('set-cookie')
  return single ? [single] : []
}

function readUserId(payload: unknown): string {
  if (!isRecord(payload) || !isRecord(payload.user) || typeof payload.user.id !== 'string') {
    throw new Error('signup response missing user id')
  }
  return payload.user.id
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
