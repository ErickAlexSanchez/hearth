import type { FeedPostJson } from '@/contracts/schemas'
import { formatWhen } from '@/ui/format'

export function PostCard({ post }: { post: FeedPostJson }) {
  return (
    <article className="post">
      <header>
        <p className="author">{post.author.displayName}</p>
        <p>
          <time dateTime={post.createdAt}>{formatWhen(post.createdAt)}</time>
        </p>
        <p className="visibility">{post.visibility === 'members' ? 'Members' : 'Everyone'}</p>
      </header>
      <p className="post-body">{post.body}</p>
      <a href={`/posts/${post.id}`}>Open post by {post.author.displayName}</a>
    </article>
  )
}
