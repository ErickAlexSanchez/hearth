'use client'

import type { FeedPostJson } from '@/contracts/schemas'
import { formatWhen } from '@/ui/format'
import { useCopy, usePreferences } from '@/ui/preferences'

export function PostCard({ post }: { post: FeedPostJson }) {
  const copy = useCopy()
  const { locale } = usePreferences()
  return (
    <article className="post">
      <header>
        <p className="author">{post.author.displayName}</p>
        <p>
          <time dateTime={post.createdAt}>{formatWhen(post.createdAt, locale)}</time>
        </p>
        <p className="visibility">{post.visibility === 'members' ? copy.members : copy.everyone}</p>
      </header>
      <p className="post-body">{post.body}</p>
      <a href={`/posts/${post.id}`}>{copy.openPost(post.author.displayName)}</a>
    </article>
  )
}
