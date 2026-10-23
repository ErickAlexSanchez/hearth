import { createContainer } from '@/composition/container'
import type { Env } from '@/composition/env'
import type { FeedRepository } from '@/ports/feed-repository'

describe('feed replica seam', () => {
  it('sends feed reads through DATABASE_READ_URL and writes through DATABASE_URL', async () => {
    const env: Env = {
      DATABASE_URL: 'postgres://hearth:hearth@localhost:5434/hearth?application_name=write',
      DATABASE_READ_URL: 'postgres://hearth:hearth@localhost:5434/hearth?application_name=read',
      SESSION_SECRET: 'local-dev-session-secret',
      WEBHOOK_SECRET: 'local-dev-webhook-secret',
      COACH_RETENTION_DAYS: 30,
      COACH_ADAPTER: 'fake',
    }
    const container = createContainer(env)
    try {
      expect(connectionStringOf(container.feedReads)).toBe(env.DATABASE_READ_URL)
      expect(connectionStringOf(container.feedWrites)).toBe(env.DATABASE_URL)
      expect(container.feedReads).not.toBe(container.feedWrites)
    } finally {
      await container.close()
    }
  })
})

function connectionStringOf(repository: FeedRepository): string {
  if (!('connectionString' in repository)) {
    throw new Error('Expected the Postgres feed repository.')
  }
  const value = repository.connectionString
  if (typeof value !== 'string') {
    throw new Error('Expected the Postgres feed repository.')
  }
  return value
}
