import { DomainError } from '@/domain/errors'
import { assertUuid } from '@/domain/ids'

export type FeedCursor = {
  createdAt: string
  id: string
}

export function encodeCursor(cursor: FeedCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url')
}

export function decodeCursor(value: string): FeedCursor {
  let raw: unknown
  try {
    raw = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown
  } catch (error) {
    if (error instanceof DomainError) throw error
    throw new DomainError('VALIDATION', 'Invalid cursor.')
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new DomainError('VALIDATION', 'Invalid cursor.')
  }
  const createdAt = 'createdAt' in raw ? raw.createdAt : undefined
  const id = 'id' in raw ? raw.id : undefined
  if (typeof createdAt !== 'string' || typeof id !== 'string') {
    throw new DomainError('VALIDATION', 'Invalid cursor.')
  }
  const time = Date.parse(createdAt)
  if (Number.isNaN(time)) {
    throw new DomainError('VALIDATION', 'Invalid cursor.')
  }
  return {
    createdAt: new Date(time).toISOString(),
    id: assertUuid(id),
  }
}
