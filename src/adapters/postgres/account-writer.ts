import type { Pool } from 'pg'
import { DomainError } from '@/domain/errors'
import type { AccountWriter } from '@/ports/account-writer'
import { queryRows } from '@/adapters/postgres/query'

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
}

export function createAccountWriter(pool: Pool): AccountWriter {
  return {
    async createAccount(input) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        await queryRows(client, `
          insert into identity.users (id, email, display_name, password_hash, created_at)
          values ($1, $2, $3, $4, $5)
        `, [input.user.id, input.user.email, input.user.displayName, input.user.passwordHash, input.user.createdAt])
        await queryRows(client, `
          insert into membership.memberships (user_id, tier, updated_at)
          values ($1, $2, $3)
        `, [input.membership.userId, input.membership.tier, input.membership.updatedAt])
        await queryRows(client, `
          insert into identity.sessions (token_hash, user_id, created_at, expires_at)
          values ($1, $2, $3, $4)
        `, [input.session.tokenHash, input.session.userId, input.session.createdAt, input.session.expiresAt])
        await client.query('COMMIT')
      } catch (error) {
        try {
          await client.query('ROLLBACK')
        } catch (rollbackError) {
          const rollbackName = rollbackError instanceof Error ? rollbackError.name : 'Error'
          const originalName = error instanceof Error ? error.name : 'Error'
          throw new Error(`Rollback failed (${rollbackName}) after ${originalName}.`)
        }
        if (isUniqueViolation(error)) {
          throw new DomainError('VALIDATION', 'An account with that email already exists.')
        }
        throw error
      } finally {
        client.release()
      }
    },
  }
}
