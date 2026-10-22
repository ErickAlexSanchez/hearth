import { createContainer } from '@/composition/container'
import type { Env } from '@/composition/env'

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
      expect(container.feedReads.connectionString).toBe(env.DATABASE_READ_URL)
      expect(container.feedWrites.connectionString).toBe(env.DATABASE_URL)
      expect(container.feedReads).not.toBe(container.feedWrites)
    } finally {
      await container.close()
    }
  })
})
