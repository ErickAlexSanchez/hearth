import { DomainError } from '@/domain/errors'

export function assertPostBody(body: string): string {
  const trimmed = body.trim()
  if (trimmed.length < 1 || trimmed.length > 2000) {
    throw new DomainError('VALIDATION', 'Post must be 1 to 2000 characters.')
  }
  return trimmed
}

export function assertFeedLimit(limit: number): number {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new DomainError('VALIDATION', 'Limit must be between 1 and 20.')
  }
  return limit
}
