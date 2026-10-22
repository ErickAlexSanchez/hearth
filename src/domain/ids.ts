import { DomainError } from '@/domain/errors'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function assertUuid(value: string): string {
  if (!UUID.test(value)) {
    throw new DomainError('VALIDATION', 'The id is invalid.')
  }
  return value
}
