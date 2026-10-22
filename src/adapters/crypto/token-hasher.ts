import { createHash } from 'node:crypto'
import type { TokenHasher } from '@/ports/token-hasher'

export function createTokenHasher(): TokenHasher {
  return {
    hash(token: string): string {
      return createHash('sha256').update(token).digest('hex')
    },
  }
}
