import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().min(1).refine(isPostgresUrl),
  DATABASE_READ_URL: z.string().min(1).refine(isPostgresUrl),
  SESSION_SECRET: z.string().min(16),
  WEBHOOK_SECRET: z.string().min(16),
  COACH_RETENTION_DAYS: z.coerce.number().int().min(1).max(3650),
  COACH_ADAPTER: z.literal('fake'),
})

export type Env = z.infer<typeof schema>

function isPostgresUrl(value: string): boolean {
  return value.startsWith('postgres://') || value.startsWith('postgresql://')
}

function clean(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = schema.safeParse({
    DATABASE_URL: clean(source.DATABASE_URL),
    DATABASE_READ_URL: clean(source.DATABASE_READ_URL),
    SESSION_SECRET: clean(source.SESSION_SECRET),
    WEBHOOK_SECRET: clean(source.WEBHOOK_SECRET),
    COACH_RETENTION_DAYS: clean(source.COACH_RETENTION_DAYS),
    COACH_ADAPTER: clean(source.COACH_ADAPTER),
  })
  if (!parsed.success) {
    const fields = [
      ...new Set(parsed.error.issues.map((issue) => issue.path.map(String).join('.') || 'env')),
    ]
    throw new Error(`Incomplete environment: ${fields.join(', ')}`)
  }
  return parsed.data
}

let cached: Env | undefined

export function getEnv(): Env {
  if (!cached) cached = parseEnv(process.env)
  return cached
}
