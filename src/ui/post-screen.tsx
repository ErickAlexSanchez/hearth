'use client'

import { useQuery } from '@tanstack/react-query'
import { ApiError, fetchPost, fetchSession } from '@/ui/api'
import { PostCard } from '@/ui/post-card'
import { Shell } from '@/ui/shell'
import { ErrorState, LoadingState } from '@/ui/status'

export function PostScreen({ id }: { id: string }) {
  const isBrowser = typeof window !== 'undefined'
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    enabled: isBrowser,
  })
  const postQuery = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    enabled: isBrowser && sessionQuery.data?.user != null,
  })

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
  if (!sessionQuery.data.user) {
    return (
      <Shell>
        <section className="panel">
          <h1>Post</h1>
          <p>Sign in to read this post.</p>
          <a className="button" href="/login">
            Sign in
          </a>
        </section>
      </Shell>
    )
  }
  if (postQuery.isPending) {
    return (
      <Shell>
        <LoadingState label="Loading the post…" />
      </Shell>
    )
  }
  if (postQuery.isError) {
    const forbidden = postQuery.error instanceof ApiError && postQuery.error.name === 'ForbiddenError'
    const missing = postQuery.error instanceof ApiError && postQuery.error.name === 'NotFoundError'
    return (
      <Shell>
        <h1>Post</h1>
        {forbidden ? (
          <div className="status error" role="alert">
            <p>This post is for members.</p>
            <a href="/">Back to the feed</a>
          </div>
        ) : null}
        {missing ? (
          <div className="status error" role="alert">
            <p>This post is not available.</p>
            <a href="/">Back to the feed</a>
          </div>
        ) : null}
        {!forbidden && !missing ? (
          <ErrorState
            message="Could not load this post."
            onRetry={() => {
              void postQuery.refetch()
            }}
          />
        ) : null}
      </Shell>
    )
  }

  return (
    <Shell>
      <h1>Post</h1>
      <PostCard post={postQuery.data} />
    </Shell>
  )
}
