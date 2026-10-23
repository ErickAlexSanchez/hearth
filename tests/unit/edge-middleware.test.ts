import { readFileSync } from 'node:fs'
import path from 'node:path'
import { register } from '@/instrumentation'

const root = process.cwd()

describe('edge middleware', () => {
  it('assigns a request id without node drivers or the environment parser', () => {
    const middleware = readFileSync(path.join(root, 'src/middleware.ts'), 'utf8')
    expect(middleware).toContain('x-request-id')
    expect(middleware).not.toContain('node:crypto')
    expect(middleware).not.toContain('node:fs')
    expect(middleware).not.toContain("from 'pg'")
    expect(middleware).not.toContain('from "pg"')
    expect(middleware).not.toContain('getEnv')
    expect(middleware).not.toContain('DATABASE_URL')
    expect(middleware).not.toContain('@/composition')
    expect(middleware).not.toContain('@/instrumentation')

    const instrumentation = readFileSync(path.join(root, 'src/instrumentation.ts'), 'utf8')
    const edgeGuard = instrumentation.indexOf("process.env.NEXT_RUNTIME === 'edge'")
    const nodeImport = instrumentation.indexOf('@/instrumentation-node')
    expect(edgeGuard).toBeGreaterThan(-1)
    expect(nodeImport).toBeGreaterThan(edgeGuard)
    expect(instrumentation).not.toContain("from 'pg'")
    expect(instrumentation).not.toContain('node:crypto')

    const nodeHook = readFileSync(path.join(root, 'src/instrumentation-node.ts'), 'utf8')
    expect(nodeHook).not.toContain("from 'pg'")
    expect(nodeHook).not.toContain('node:crypto')
    expect(nodeHook.indexOf('DATABASE_URL')).toBeLessThan(nodeHook.indexOf('@/composition/env'))
  })

  it('does not throw on the edge runtime when the database environment is missing or partial', async () => {
    await withProcessEnv(
      {
        NEXT_RUNTIME: 'edge',
        DATABASE_URL: 'postgres://hearth:hearth@127.0.0.1:5434/hearth',
        DATABASE_READ_URL: undefined,
        SESSION_SECRET: undefined,
        WEBHOOK_SECRET: undefined,
      },
      async () => {
        await expect(register()).resolves.toBeUndefined()
      },
    )
  })

  it('boots the node runtime when no database url is configured', async () => {
    await withProcessEnv(
      {
        NEXT_RUNTIME: 'nodejs',
        NEXT_PHASE: undefined,
        DATABASE_URL: undefined,
        DATABASE_READ_URL: '   ',
      },
      async () => {
        await expect(register()).resolves.toBeUndefined()
      },
    )
  })

  it('still refuses a partial database environment on the node runtime', async () => {
    await withProcessEnv(
      {
        NEXT_RUNTIME: 'nodejs',
        NEXT_PHASE: undefined,
        DATABASE_URL: 'postgres://hearth:hearth@127.0.0.1:5434/hearth',
        DATABASE_READ_URL: undefined,
        SESSION_SECRET: 'super-secret-value-here',
        WEBHOOK_SECRET: undefined,
        COACH_RETENTION_DAYS: undefined,
        COACH_ADAPTER: undefined,
      },
      async () => {
        await expect(register()).rejects.toThrow(/Incomplete environment/)
        try {
          await register()
          throw new Error('expected register to throw')
        } catch (error) {
          const message = error instanceof Error ? error.message : ''
          expect(message).toMatch(/Incomplete environment/)
          expect(message).not.toContain('super-secret-value-here')
          expect(message).not.toContain('hearth:hearth')
        }
      },
    )
  })

  it('skips the database check during the production build', async () => {
    await withProcessEnv(
      {
        NEXT_RUNTIME: 'nodejs',
        NEXT_PHASE: 'phase-production-build',
        DATABASE_URL: 'postgres://hearth:hearth@127.0.0.1:5434/hearth',
        DATABASE_READ_URL: undefined,
      },
      async () => {
        await expect(register()).resolves.toBeUndefined()
      },
    )
  })
})

async function withProcessEnv(
  values: Record<string, string | undefined>,
  run: () => Promise<void>,
): Promise<void> {
  const previous = new Map<string, string | undefined>()
  for (const key of Object.keys(values)) previous.set(key, process.env[key])
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    await run()
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}
