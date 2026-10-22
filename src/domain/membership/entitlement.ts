import { DomainError } from '@/domain/errors'

export type Tier = 'free' | 'member'
export type Visibility = 'public' | 'members'

export function assertVisibility(value: string): Visibility {
  if (value === 'public' || value === 'members') return value
  throw new DomainError('VALIDATION', 'Visibility must be public or members.')
}

export function assertTier(value: string): Tier {
  if (value === 'free' || value === 'member') return value
  throw new DomainError('VALIDATION', 'Membership tier is invalid.')
}

export function feedIncludesMembers(tier: Tier): boolean {
  return tier === 'member'
}

export function assertCanReadPost(tier: Tier, visibility: Visibility): void {
  if (visibility === 'members' && tier !== 'member') {
    throw new DomainError('FORBIDDEN', 'This post is for members.')
  }
}

export function assertCanPublish(tier: Tier, visibility: Visibility): void {
  if (visibility === 'members' && tier !== 'member') {
    throw new DomainError('FORBIDDEN', 'Only members can publish a members-only post.')
  }
}
