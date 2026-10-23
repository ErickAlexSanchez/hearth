'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ApiError, fetchFeedPage, fetchSession } from '@/ui/api'
import { Composer } from '@/ui/composer'
import { PostCard } from '@/ui/post-card'
import { useCopy } from '@/ui/preferences'
import { Shell } from '@/ui/shell'
import { EmptyState, ErrorState, LoadingState } from '@/ui/status'

export function FeedScreen() {
  const copy = useCopy()
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
        <LoadingState label={copy.loadingHearth} />
      </Shell>
    )
  }
  if (sessionQuery.isError) {
    return (
      <Shell>
        <ErrorState
          message={copy.sessionError}
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
      <h1>{copy.feed}</h1>
      <p className="lede">{copy.feedLede}</p>
      <Composer />
      {feedQuery.isPending ? <LoadingState label={copy.loadingFeed} /> : null}
      {feedQuery.isError ? (
        <ErrorState
          message={copy.feedError}
          onRetry={() => {
            void feedQuery.refetch()
          }}
        />
      ) : null}
      {feedQuery.isSuccess && posts.length === 0 ? <EmptyState message={copy.emptyFeed} /> : null}
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
              {feedQuery.isFetchingNextPage ? copy.loadingMore : copy.loadMore}
            </button>
          ) : null}
        </>
      ) : null}
    </Shell>
  )
}

function SignedOut() {
  const copy = useCopy()
  return (
    <section className="panel">
      <h1>{copy.signedOutTitle}</h1>
      <p>{copy.signedOutBody}</p>
      <div className="row">
        <a className="button" href="/login">
          {copy.signIn}
        </a>
        <a className="button secondary" href="/signup">
          {copy.createAccount}
        </a>
      </div>
    </section>
  )
}
