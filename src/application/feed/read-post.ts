import { assertUuid } from '@/domain/ids'
import { DomainError } from '@/domain/errors'
import { assertCanReadPost } from '@/domain/membership/entitlement'
import type { FeedPostView } from '@/application/feed/read-feed'
import type { FeedRepository } from '@/ports/feed-repository'
import type { IdentityRepository } from '@/ports/identity-repository'
import type { MembershipRepository } from '@/ports/membership-repository'

export async function readPost(
  deps: {
    memberships: MembershipRepository
    feedReads: FeedRepository
    identity: IdentityRepository
  },
  input: { userId: string; postId: string },
): Promise<FeedPostView> {
  const postId = assertUuid(input.postId)
  const [post, membership] = await Promise.all([
    deps.feedReads.findById(postId),
    deps.memberships.findByUserId(input.userId),
  ])
  if (!membership) {
    throw new DomainError('UNAUTHORIZED', 'Sign in required.')
  }
  if (!post) {
    throw new DomainError('NOT_FOUND', 'Post not found.')
  }
  assertCanReadPost(membership.tier, post.visibility)
  const author = await deps.identity.findUserById(post.authorId)
  return {
    id: post.id,
    body: post.body,
    visibility: post.visibility,
    createdAt: post.createdAt.toISOString(),
    author: {
      id: post.authorId,
      displayName: author?.displayName ?? 'Member',
    },
  }
}
