import { DomainError } from '@/domain/errors'
import { decodeCursor, encodeCursor } from '@/domain/feed/cursor'

describe('feed cursor', () => {
  it('round-trips a cursor', () => {
    const cursor = {
      createdAt: '2026-10-22T12:00:00.000Z',
      id: '33333333-3333-4333-8333-333333333333',
    }
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor)
  })

  it('rejects a malformed cursor', () => {
    expect(() => decodeCursor('not-a-cursor')).toThrow(DomainError)
  })
})
