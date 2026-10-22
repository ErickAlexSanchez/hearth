import { parseEnv } from '@/composition/env'

const complete = {
  DATABASE_URL: 'postgres://hearth:hearth@localhost:5434/hearth',
  DATABASE_READ_URL: 'postgres://hearth:hearth@localhost:5434/hearth?application_name=read',
  SESSION_SECRET: 'local-dev-session-secret',
  WEBHOOK_SECRET: 'local-dev-webhook-secret',
  COACH_RETENTION_DAYS: '30',
  COACH_ADAPTER: 'fake',
}

describe('environment', () => {
  it('parses a complete environment and keeps the read url distinct', () => {
    const env = parseEnv(complete)
    expect(env.DATABASE_READ_URL).toBe(complete.DATABASE_READ_URL)
    expect(env.DATABASE_URL).toBe(complete.DATABASE_URL)
    expect(env.COACH_RETENTION_DAYS).toBe(30)
    expect(env.COACH_ADAPTER).toBe('fake')
  })

  it('refuses to start when the environment is incomplete, without echoing secrets', () => {
    expect(() => parseEnv({})).toThrow(/Incomplete environment/)
    try {
      parseEnv({ SESSION_SECRET: 'super-secret-value-here' })
      throw new Error('expected parseEnv to throw')
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      expect(message).toMatch(/Incomplete environment/)
      expect(message).not.toContain('super-secret-value-here')
    }
  })
})
