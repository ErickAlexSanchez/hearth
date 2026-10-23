'use client'

import { useQuery } from '@tanstack/react-query'
import { ApiError, fetchPost, fetchSession } from '@/ui/api'
import { PostCard } from '@/ui/post-card'
import { useCopy } from '@/ui/preferences'
import { Shell } from '@/ui/shell'
import { ErrorState, LoadingState } from '@/ui/status'

export function PostScreen({ id }: { id: string }) {
  const copy = useCopy()
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
  if (!sessionQuery.data.user) {
    return (
      <Shell>
        <section className="panel">
          <h1>{copy.postTitle}</h1>
          <p>{copy.signInToReadPost}</p>
          <a className="button" href="/login">
            {copy.signIn}
          </a>
        </section>
      </Shell>
    )
  }
  if (postQuery.isPending) {
    return (
      <Shell>
        <LoadingState label={copy.loadingPost} />
      </Shell>
    )
  }
  if (postQuery.isError) {
    const forbidden = postQuery.error instanceof ApiError && postQuery.error.name === 'ForbiddenError'
    const missing = postQuery.error instanceof ApiError && postQuery.error.name === 'NotFoundError'
    return (
      <Shell>
        <h1>{copy.postTitle}</h1>
        {forbidden ? (
          <div className="status error" role="alert">
            <p>{copy.membersOnly}</p>
            <a href="/">{copy.backToFeed}</a>
          </div>
        ) : null}
        {missing ? (
          <div className="status error" role="alert">
            <p>{copy.postUnavailable}</p>
            <a href="/">{copy.backToFeed}</a>
          </div>
        ) : null}
        {!forbidden && !missing ? (
          <ErrorState
            message={copy.postError}
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
      <h1>{copy.postTitle}</h1>
      <PostCard post={postQuery.data} />
    </Shell>
  )
}
