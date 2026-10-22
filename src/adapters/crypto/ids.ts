import { randomBytes, randomUUID } from 'node:crypto'
import type { IdGenerator } from '@/ports/id-generator'

export function createIdGenerator(): IdGenerator {
  return {
    uuid: () => randomUUID(),
    sessionToken: () => randomBytes(32).toString('base64url'),
  }
}
