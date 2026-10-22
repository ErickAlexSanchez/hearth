import type { Pool } from 'pg'
import { queryRows } from '@/adapters/postgres/query'
import type { Tier } from '@/domain/membership/entitlement'
import type { MembershipRecord, MembershipRepository } from '@/ports/membership-repository'

type MembershipRow = {
  user_id: string
  tier: string
  updated_at: Date
}

function toTier(value: string): Tier {
  if (value === 'free' || value === 'member') return value
  throw new Error('Unexpected membership tier.')
}

export class PgMembershipRepository implements MembershipRepository {
  constructor(private readonly pool: Pool) {}

  async insert(membership: MembershipRecord): Promise<void> {
    await queryRows(this.pool, `
      insert into membership.memberships (user_id, tier, updated_at)
      values ($1, $2, $3)
    `, [membership.userId, membership.tier, membership.updatedAt])
  }

  async findByUserId(userId: string): Promise<MembershipRecord | null> {
    const result = await queryRows<MembershipRow>(this.pool, `
      select user_id, tier, updated_at
      from membership.memberships
      where user_id = $1
    `, [userId])
    const row = result.rows[0]
    if (!row) return null
    return {
      userId: row.user_id,
      tier: toTier(row.tier),
      updatedAt: row.updated_at,
    }
  }

  async setTier(userId: string, tier: Tier, updatedAt: Date): Promise<void> {
    await queryRows(this.pool, `
      update membership.memberships
      set tier = $2, updated_at = $3
      where user_id = $1
    `, [userId, tier, updatedAt])
  }
}
