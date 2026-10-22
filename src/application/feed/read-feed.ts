import { decodeCursor, encodeCursor } from '@/domain/feed/cursor'
import { assertFeedLimit } from '@/domain/feed/post'
import { DomainError } from '@/domain/errors'
import { feedIncludesMembers, type Visibility } from '@/domain/membership/entitlement'
import type { FeedRepository } from '@/ports/feed-repository'
import type { IdentityRepository } from '@/ports/identity-repository'
import type { MembershipRepository } from '@/ports/membership-repository'

export type FeedPostView = {
  id: string
  body: string
  visibility: Visibility
  createdAt: string
  author: {
    id: string
    displayName: string
  }
}

export type FeedPage = {
  posts: FeedPostView[]
  nextCursor: string | null
}

export async function readFeed(
  deps: {
    memberships: MembershipRepository
    feedReads: FeedRepository
    identity: IdentityRepository
  },
  input: { userId: string; cursor: string | null; limit: number },
): Promise<FeedPage> {
  const membership = await deps.memberships.findByUserId(input.userId)
  if (!membership) {
    throw new DomainError('UNAUTHORIZED', 'Sign in required.')
  }
  const limit = assertFeedLimit(input.limit)
  const cursor = input.cursor ? decodeCursor(input.cursor) : null
  const rows = await deps.feedReads.list({
    limit: limit + 1,
    cursor,
    includeMembers: feedIncludesMembers(membership.tier),
  })
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const authorIds = [...new Set(page.map((post) => post.authorId))]
  const authors = authorIds.length === 0 ? [] : await deps.identity.findUsersByIds(authorIds)
  const names = new Map(authors.map((author) => [author.id, author.displayName]))
  const last = page[page.length - 1]
  return {
    posts: page.map((post) => ({
      id: post.id,
      body: post.body,
      visibility: post.visibility,
      createdAt: post.createdAt.toISOString(),
      author: {
        id: post.authorId,
        displayName: names.get(post.authorId) ?? 'Member',
      },
    })),
    nextCursor: hasMore && last ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id }) : null,
  }
}
