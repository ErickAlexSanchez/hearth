import type { Pool } from 'pg'
import { queryRows } from '@/adapters/postgres/query'
import type { CoachMessageRecord, CoachRepository, CoachRole } from '@/ports/coach-repository'

type CoachRow = {
  id: string
  user_id: string
  role: string
  body: string
  created_at: Date
}

function toRole(value: string): CoachRole {
  if (value === 'user' || value === 'coach') return value
  throw new Error('Unexpected coach role.')
}

export class PgCoachRepository implements CoachRepository {
  constructor(private readonly pool: Pool) {}

  async insert(message: CoachMessageRecord): Promise<void> {
    await queryRows(this.pool, `
      insert into coach.messages (id, user_id, role, body, created_at)
      values ($1, $2, $3, $4, $5)
    `, [message.id, message.userId, message.role, message.body, message.createdAt])
  }

  async listByUser(userId: string, limit: number): Promise<CoachMessageRecord[]> {
    const result = await queryRows<CoachRow>(this.pool, `
      select id, user_id, role, body, created_at
      from coach.messages
      where user_id = $1
      order by created_at asc
      limit $2
    `, [userId, limit])
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      role: toRole(row.role),
      body: row.body,
      createdAt: row.created_at,
    }))
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const result = await queryRows(this.pool, `
      delete from coach.messages
      where created_at < $1
    `, [cutoff])
    return result.rowCount
  }
}
