import { copyMembership, insertMembership, type MemoryStore } from '@/adapters/memory/store'
import type { Tier } from '@/domain/membership/entitlement'
import type { MembershipRecord, MembershipRepository } from '@/ports/membership-repository'

export class MemoryMembershipRepository implements MembershipRepository {
  constructor(private readonly store: MemoryStore) {}

  async insert(membership: MembershipRecord): Promise<void> {
    insertMembership(this.store, membership)
  }

  async findByUserId(userId: string): Promise<MembershipRecord | null> {
    const membership = this.store.memberships.get(userId)
    return membership ? copyMembership(membership) : null
  }

  async setTier(userId: string, tier: Tier, updatedAt: Date): Promise<void> {
    const existing = this.store.memberships.get(userId)
    if (!existing) return
    this.store.memberships.set(userId, {
      userId,
      tier,
      updatedAt: new Date(updatedAt.getTime()),
    })
  }
}
