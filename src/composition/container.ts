import { Pool } from 'pg'
import { createAccountWriter } from '@/adapters/postgres/account-writer'
import { PgCoachRepository } from '@/adapters/postgres/coach-repository'
import { PgFeedRepository } from '@/adapters/postgres/feed-repository'
import { PgIdentityRepository } from '@/adapters/postgres/identity-repository'
import { PgMembershipRepository } from '@/adapters/postgres/membership-repository'
import { migrateDatabase } from '@/adapters/postgres/migrate'
import { createFakeCoachResponder } from '@/adapters/coach/fake-coach-responder'
import { createSystemClock } from '@/adapters/crypto/clock'
import { createIdGenerator } from '@/adapters/crypto/ids'
import { createScryptPasswordHasher } from '@/adapters/crypto/scrypt-password'
import { createTokenHasher } from '@/adapters/crypto/token-hasher'
import { createJsonLogger } from '@/adapters/logging/json-logger'
import { getEnv, type Env } from '@/composition/env'
import type { CoachResponder } from '@/ports/coach-responder'
import type { AccountWriter } from '@/ports/account-writer'
import type { Clock } from '@/ports/clock'
import type { CoachRepository } from '@/ports/coach-repository'
import type { IdGenerator } from '@/ports/id-generator'
import type { IdentityRepository } from '@/ports/identity-repository'
import type { Logger } from '@/ports/logger'
import type { MembershipRepository } from '@/ports/membership-repository'
import type { PasswordHasher } from '@/ports/password-hasher'
import type { TokenHasher } from '@/ports/token-hasher'

export type Container = {
  env: Env
  logger: Logger
  identity: IdentityRepository
  memberships: MembershipRepository
  feedReads: PgFeedRepository
  feedWrites: PgFeedRepository
  coach: CoachRepository
  accounts: AccountWriter
  responder: CoachResponder
  hasher: PasswordHasher
  tokens: TokenHasher
  ids: IdGenerator
  clock: Clock
  migrate: () => Promise<void>
  ping: () => Promise<void>
  close: () => Promise<void>
}

type GlobalStore = typeof globalThis & { __hearthContainer?: Container }

function globalStore(): GlobalStore {
  return globalThis as GlobalStore
}

export function createContainer(env: Env): Container {
  const logger = createJsonLogger()
  const writePool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 3000,
    application_name: 'hearth-write',
  })
  const readPool = new Pool({
    connectionString: env.DATABASE_READ_URL,
    max: 5,
    connectionTimeoutMillis: 3000,
    application_name: 'hearth-read',
  })
  writePool.on('error', () => {
    logger.error('db.pool_error', { role: 'write' })
  })
  readPool.on('error', () => {
    logger.error('db.pool_error', { role: 'read' })
  })
  const responder = selectCoachResponder(env.COACH_ADAPTER)
  return {
    env,
    logger,
    identity: new PgIdentityRepository(writePool),
    memberships: new PgMembershipRepository(writePool),
    feedReads: new PgFeedRepository(readPool, env.DATABASE_READ_URL),
    feedWrites: new PgFeedRepository(writePool, env.DATABASE_URL),
    coach: new PgCoachRepository(writePool),
    accounts: createAccountWriter(writePool),
    responder,
    hasher: createScryptPasswordHasher(),
    tokens: createTokenHasher(),
    ids: createIdGenerator(),
    clock: createSystemClock(),
    migrate: () => migrateDatabase(writePool),
    ping: async () => {
      await writePool.query('select 1')
      await readPool.query('select 1')
    },
    close: async () => {
      await writePool.end()
      await readPool.end()
    },
  }
}

function selectCoachResponder(adapter: Env['COACH_ADAPTER']): CoachResponder {
  if (adapter === 'fake') return createFakeCoachResponder()
  throw new Error('Incomplete environment: COACH_ADAPTER')
}

export function getContainer(): Container {
  const store = globalStore()
  if (!store.__hearthContainer) {
    store.__hearthContainer = createContainer(getEnv())
  }
  return store.__hearthContainer
}

export async function closeContainer(): Promise<void> {
  const store = globalStore()
  const existing = store.__hearthContainer
  if (!existing) return
  store.__hearthContainer = undefined
  await existing.close()
}
