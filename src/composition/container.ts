import { Pool } from 'pg'
import { createMemoryAccountWriter } from '@/adapters/memory/account-writer'
import { MemoryCoachRepository } from '@/adapters/memory/coach-repository'
import { MemoryFeedRepository } from '@/adapters/memory/feed-repository'
import { MemoryIdentityRepository } from '@/adapters/memory/identity-repository'
import { MemoryMembershipRepository } from '@/adapters/memory/membership-repository'
import { createMemoryStore, insertSession } from '@/adapters/memory/store'
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
import { DEMO_SESSION_SECRET, sealSession, sessionLifetimeMs } from '@/adapters/crypto/session-seal'
import { createCatalogTokenHasher, createTokenHasher } from '@/adapters/crypto/token-hasher'
import { createJsonLogger } from '@/adapters/logging/json-logger'
import { seedDemoCatalog } from '@/composition/demo-catalog'
import { hasDatabaseSetting, parseEnv, readEnvValue, type Env, type ServiceEnv } from '@/composition/env'
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
import type { FeedRepository } from '@/ports/feed-repository'

export type SessionCookieInput = {
  sessionToken: string
  userId: string
}

export type Container = {
  env: ServiceEnv
  logger: Logger
  identity: IdentityRepository
  memberships: MembershipRepository
  feedReads: FeedRepository
  feedWrites: FeedRepository
  coach: CoachRepository
  accounts: AccountWriter
  responder: CoachResponder
  hasher: PasswordHasher
  tokens: TokenHasher
  ids: IdGenerator
  clock: Clock
  issueSessionCookie: (input: SessionCookieInput) => string
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
    issueSessionCookie: (input) => input.sessionToken,
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

export function createAppContainer(source: Record<string, string | undefined>): Container {
  if (hasDatabaseSetting(source)) return createContainer(parseEnv(source))
  return createMemoryContainer(source)
}

function createMemoryContainer(source: Record<string, string | undefined>): Container {
  const sessionSecret = memorySessionSecret(source)
  const env: ServiceEnv = {
    DATABASE_URL: null,
    DATABASE_READ_URL: null,
    SESSION_SECRET: sessionSecret,
    WEBHOOK_SECRET: memoryWebhookSecret(source),
    COACH_RETENTION_DAYS: memoryRetentionDays(source),
    COACH_ADAPTER: memoryCoachAdapter(source),
  }
  const logger = createJsonLogger()
  const clock = createSystemClock()
  const store = createMemoryStore()
  seedDemoCatalog(store, clock.now())
  const responder = selectCoachResponder(env.COACH_ADAPTER)
  return {
    env,
    logger,
    identity: new MemoryIdentityRepository(store, sessionSecret),
    memberships: new MemoryMembershipRepository(store),
    feedReads: new MemoryFeedRepository(store),
    feedWrites: new MemoryFeedRepository(store),
    coach: new MemoryCoachRepository(store),
    accounts: createMemoryAccountWriter(store),
    responder,
    hasher: createScryptPasswordHasher(),
    tokens: createCatalogTokenHasher(),
    ids: createIdGenerator(),
    clock,
    issueSessionCookie: (input) => {
      const createdAt = clock.now()
      const expiresAt = new Date(createdAt.getTime() + sessionLifetimeMs())
      const token = sealSession({
        userId: input.userId,
        createdAt,
        expiresAt,
        secret: sessionSecret,
      })
      insertSession(store, {
        tokenHash: token,
        userId: input.userId,
        createdAt,
        expiresAt,
      })
      return token
    },
    migrate: async () => {},
    ping: async () => {},
    close: async () => {},
  }
}

function memorySessionSecret(source: Record<string, string | undefined>): string {
  const value = readEnvValue(source.SESSION_SECRET)
  if (value === undefined) return DEMO_SESSION_SECRET
  if (value.length < 16) throw new Error('Incomplete environment: SESSION_SECRET')
  return value
}

function memoryWebhookSecret(source: Record<string, string | undefined>): string {
  const value = readEnvValue(source.WEBHOOK_SECRET)
  if (value === undefined) return `${crypto.randomUUID()}-${crypto.randomUUID()}`
  if (value.length < 16) throw new Error('Incomplete environment: WEBHOOK_SECRET')
  return value
}

function memoryRetentionDays(source: Record<string, string | undefined>): number {
  const value = readEnvValue(source.COACH_RETENTION_DAYS)
  if (value === undefined) return 30
  if (!/^\d+$/.test(value)) throw new Error('Incomplete environment: COACH_RETENTION_DAYS')
  const parsed = Number(value)
  if (parsed < 1 || parsed > 3650) throw new Error('Incomplete environment: COACH_RETENTION_DAYS')
  return parsed
}

function memoryCoachAdapter(source: Record<string, string | undefined>): 'fake' {
  const value = readEnvValue(source.COACH_ADAPTER)
  if (value === undefined || value === 'fake') return 'fake'
  throw new Error('Incomplete environment: COACH_ADAPTER')
}

export function getContainer(): Container {
  const store = globalStore()
  if (!store.__hearthContainer) {
    store.__hearthContainer = createAppContainer(process.env)
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
