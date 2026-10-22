import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { Pool } from 'pg'

export async function migrateDatabase(pool: Pool, migrationsDir = path.join(process.cwd(), 'migrations')): Promise<void> {
  await pool.query(`
    create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )
  `)
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
  for (const file of files) {
    const applied = await pool.query<{ version: string }>(
      'select version from public.schema_migrations where version = $1',
      [file],
    )
    if (applied.rows[0]) continue
    const sql = readFileSync(path.join(migrationsDir, file), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('insert into public.schema_migrations (version) values ($1)', [file])
      await client.query('COMMIT')
    } catch (error) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        const rollbackName = rollbackError instanceof Error ? rollbackError.name : 'Error'
        const originalName = error instanceof Error ? error.name : 'Error'
        throw new Error(`Rollback failed (${rollbackName}) after ${originalName}.`)
      }
      throw error
    } finally {
      client.release()
    }
  }
}
