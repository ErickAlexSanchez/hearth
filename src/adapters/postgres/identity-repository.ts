import type { Pool } from 'pg'
import { queryRows } from '@/adapters/postgres/query'
import type { IdentityRepository, SessionRecord, UserRecord } from '@/ports/identity-repository'

type UserRow = {
  id: string
  email: string
  display_name: string
  password_hash: string
  created_at: Date
}

type SessionRow = {
  token_hash: string
  user_id: string
  created_at: Date
  expires_at: Date
}

function toUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  }
}

export class PgIdentityRepository implements IdentityRepository {
  constructor(private readonly pool: Pool) {}

  async insertUser(user: UserRecord): Promise<void> {
    await queryRows(this.pool, `
      insert into identity.users (id, email, display_name, password_hash, created_at)
      values ($1, $2, $3, $4, $5)
    `, [user.id, user.email, user.displayName, user.passwordHash, user.createdAt])
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const result = await queryRows<UserRow>(this.pool, `
      select id, email, display_name, password_hash, created_at
      from identity.users
      where email = $1
    `, [email])
    const row = result.rows[0]
    return row ? toUser(row) : null
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const result = await queryRows<UserRow>(this.pool, `
      select id, email, display_name, password_hash, created_at
      from identity.users
      where id = $1
    `, [id])
    const row = result.rows[0]
    return row ? toUser(row) : null
  }

  async findUsersByIds(ids: readonly string[]): Promise<UserRecord[]> {
    if (ids.length === 0) return []
    const result = await queryRows<UserRow>(this.pool, `
      select id, email, display_name, password_hash, created_at
      from identity.users
      where id = any($1::uuid[])
    `, [ids])
    return result.rows.map(toUser)
  }

  async insertSession(session: SessionRecord): Promise<void> {
    await queryRows(this.pool, `
      insert into identity.sessions (token_hash, user_id, created_at, expires_at)
      values ($1, $2, $3, $4)
    `, [session.tokenHash, session.userId, session.createdAt, session.expiresAt])
  }

  async findSession(tokenHash: string): Promise<SessionRecord | null> {
    const result = await queryRows<SessionRow>(this.pool, `
      select token_hash, user_id, created_at, expires_at
      from identity.sessions
      where token_hash = $1
    `, [tokenHash])
    const row = result.rows[0]
    if (!row) return null
    return {
      tokenHash: row.token_hash,
      userId: row.user_id,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    }
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await queryRows(this.pool, `delete from identity.sessions where token_hash = $1`, [tokenHash])
  }

  async deleteUser(id: string): Promise<void> {
    await queryRows(this.pool, `delete from identity.users where id = $1`, [id])
  }
}
