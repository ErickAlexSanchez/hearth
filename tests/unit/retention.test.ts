import { DomainError } from '@/domain/errors'
import { retentionCutoff } from '@/domain/coach/retention'

describe('retention window', () => {
  it('cuts off whole days before now', () => {
    const now = new Date('2026-10-22T12:00:00.000Z')
    expect(retentionCutoff(now, 30).toISOString()).toBe('2026-09-22T12:00:00.000Z')
  })

  it('rejects a non-positive window', () => {
    expect(() => retentionCutoff(new Date(), 0)).toThrow(DomainError)
  })
})
