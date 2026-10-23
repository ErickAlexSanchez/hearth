import { createHash } from 'node:crypto'
import { isSealedSessionToken } from '@/adapters/crypto/session-seal'
import type { TokenHasher } from '@/ports/token-hasher'

export function createTokenHasher(): TokenHasher {
  return {
    hash(token: string): string {
      return createHash('sha256').update(token).digest('hex')
    },
  }
}

export function createCatalogTokenHasher(): TokenHasher {
  return {
    hash(token: string): string {
      if (isSealedSessionToken(token)) return token
      return createHash('sha256').update(token).digest('hex')
    },
  }
}
