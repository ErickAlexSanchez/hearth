import type { Tier } from '@/domain/membership/entitlement'

export type MembershipRecord = {
  userId: string
  tier: Tier
  updatedAt: Date
}

export interface MembershipRepository {
  insert(membership: MembershipRecord): Promise<void>
  findByUserId(userId: string): Promise<MembershipRecord | null>
  setTier(userId: string, tier: Tier, updatedAt: Date): Promise<void>
}
