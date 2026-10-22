import type { FeedPostView } from '@/application/feed/read-feed'
import { assertPostBody } from '@/domain/feed/post'
import { DomainError } from '@/domain/errors'
import { assertCanPublish, assertVisibility } from '@/domain/membership/entitlement'
import type { Clock } from '@/ports/clock'
import type { FeedRepository } from '@/ports/feed-repository'
import type { IdGenerator } from '@/ports/id-generator'
import type { MembershipRepository } from '@/ports/membership-repository'

export async function publishPost(
  deps: {
    memberships: MembershipRepository
    feedWrites: FeedRepository
    ids: IdGenerator
    clock: Clock
  },
  input: { userId: string; displayName: string; body: string; visibility: string },
): Promise<FeedPostView> {
  const body = assertPostBody(input.body)
  const visibility = assertVisibility(input.visibility)
  const membership = await deps.memberships.findByUserId(input.userId)
  if (!membership) {
    throw new DomainError('UNAUTHORIZED', 'Sign in required.')
  }
  assertCanPublish(membership.tier, visibility)
  const createdAt = deps.clock.now()
  const post = {
    id: deps.ids.uuid(),
    authorId: input.userId,
    body,
    visibility,
    createdAt,
  }
  await deps.feedWrites.insert(post)
  return {
    id: post.id,
    body: post.body,
    visibility: post.visibility,
    createdAt: createdAt.toISOString(),
    author: {
      id: input.userId,
      displayName: input.displayName,
    },
  }
}
