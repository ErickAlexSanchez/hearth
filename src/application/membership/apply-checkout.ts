import { assertUuid } from '@/domain/ids'
import { DomainError } from '@/domain/errors'
import type { Tier } from '@/domain/membership/entitlement'
import type { Clock } from '@/ports/clock'
import type { MembershipRepository } from '@/ports/membership-repository'

export async function applyMembershipCheckout(
  deps: { memberships: MembershipRepository; clock: Clock },
  userId: string,
): Promise<{ tier: Tier }> {
  const id = assertUuid(userId)
  const membership = await deps.memberships.findByUserId(id)
  if (!membership) {
    throw new DomainError('NOT_FOUND', 'Member not found.')
  }
  if (membership.tier === 'member') {
    return { tier: 'member' }
  }
  await deps.memberships.setTier(id, 'member', deps.clock.now())
  return { tier: 'member' }
}
