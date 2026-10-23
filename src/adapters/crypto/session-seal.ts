import { createHmac, timingSafeEqual } from 'node:crypto'
import { DomainError } from '@/domain/errors'
import { assertUuid } from '@/domain/ids'

const PREFIX = 'hearth1'
const SESSION_MS = 14 * 24 * 60 * 60 * 1000

export const DEMO_SESSION_SECRET = 'hearth-demo-session-key'

export function sessionLifetimeMs(): number {
  return SESSION_MS
}

export function isSealedSessionToken(token: string): boolean {
  return token.startsWith(`${PREFIX}.`)
}

export function sealSession(input: {
  userId: string
  createdAt: Date
  expiresAt: Date
  secret: string
}): string {
  const createdRaw = String(input.createdAt.getTime())
  const expiresRaw = String(input.expiresAt.getTime())
  const payload = `${input.userId}.${createdRaw}.${expiresRaw}`
  const signature = createHmac('sha256', input.secret).update(payload).digest('base64url')
  return `${PREFIX}.${payload}.${signature}`
}

export function openSealedSession(
  token: string,
  secret: string,
): { userId: string; createdAt: Date; expiresAt: Date } | null {
  if (!isSealedSessionToken(token)) return null
  const parts = token.split('.')
  if (parts.length !== 5) return null
  const prefix = parts[0]
  const userId = parts[1]
  const createdRaw = parts[2]
  const expiresRaw = parts[3]
  const signature = parts[4]
  if (
    prefix !== PREFIX ||
    userId === undefined ||
    createdRaw === undefined ||
    expiresRaw === undefined ||
    signature === undefined
  ) {
    return null
  }
  if (!/^\d+$/.test(createdRaw) || !/^\d+$/.test(expiresRaw)) return null
  const createdMs = Number(createdRaw)
  const expiresMs = Number(expiresRaw)
  if (!Number.isSafeInteger(createdMs) || !Number.isSafeInteger(expiresMs)) return null
  let id: string
  try {
    id = assertUuid(userId)
  } catch (error) {
    if (error instanceof DomainError) return null
    throw error
  }
  const expected = createHmac('sha256', secret).update(`${userId}.${createdRaw}.${expiresRaw}`).digest()
  const actual = Buffer.from(signature, 'base64url')
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null
  return {
    userId: id,
    createdAt: new Date(createdMs),
    expiresAt: new Date(expiresMs),
  }
}
