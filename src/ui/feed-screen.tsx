'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ApiError, fetchFeedPage, fetchSession } from '@/ui/api'
import { Composer } from '@/ui/composer'
import { PostCard } from '@/ui/post-card'
import { Shell } from '@/ui/shell'
import { EmptyState, ErrorState, LoadingState } from '@/ui/status'

export function FeedScreen() {
  const isBrowser = typeof window !== 'undefined'
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    enabled: isBrowser,
  })
  const feedQuery = useInfiniteQuery({
    queryKey: ['feed'],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fetchFeedPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isBrowser,
  })
  const posts = feedQuery.data?.pages.flatMap((page) => page.posts) ?? []

  if (!isBrowser || sessionQuery.isPending) {
    return (
      <Shell>
        <LoadingState label="Loading Hearth…" />
      </Shell>
    )
  }
  if (sessionQuery.isError) {
    return (
      <Shell>
        <ErrorState
          message="Could not load your session."
          onRetry={() => {
            void sessionQuery.refetch()
          }}
        />
      </Shell>
    )
  }
  if (!sessionQuery.data.user || (feedQuery.isError && feedQuery.error instanceof ApiError && feedQuery.error.name === 'UnauthorizedError')) {
    return (
      <Shell>
        <SignedOut />
      </Shell>
    )
  }

  return (
    <Shell>
      <h1>Feed</h1>
      <p className="lede">A short shared record of habits worth repeating.</p>
      <Composer />
      {feedQuery.isPending ? <LoadingState label="Loading the feed…" /> : null}
      {feedQuery.isError ? (
        <ErrorState
          message="Could not load the feed."
          onRetry={() => {
            void feedQuery.refetch()
          }}
        />
      ) : null}
      {feedQuery.isSuccess && posts.length === 0 ? <EmptyState message="No posts yet. Write the first one." /> : null}
      {feedQuery.isSuccess && posts.length > 0 ? (
        <>
          <div className="stack">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          {feedQuery.hasNextPage === true ? (
            <button
              type="button"
              onClick={() => {
                void feedQuery.fetchNextPage()
              }}
              disabled={feedQuery.isFetchingNextPage}
            >
              {feedQuery.isFetchingNextPage ? 'Loading more posts…' : 'Load more posts'}
            </button>
          ) : null}
        </>
      ) : null}
    </Shell>
  )
}

function SignedOut() {
  return (
    <section className="panel">
      <h1>The feed is for people at Hearth</h1>
      <p>Sign in to read posts and keep a habit note.</p>
      <div className="row">
        <a className="button" href="/login">
          Sign in
        </a>
        <a className="button secondary" href="/signup">
          Create an account
        </a>
      </div>
    </section>
  )
}
