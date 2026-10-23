import { copyPost, insertPost, type MemoryStore } from '@/adapters/memory/store'
import type { FeedCursor } from '@/domain/feed/cursor'
import type { FeedRepository, PostRecord } from '@/ports/feed-repository'

export class MemoryFeedRepository implements FeedRepository {
  constructor(private readonly store: MemoryStore) {}

  async insert(post: PostRecord): Promise<void> {
    insertPost(this.store, post)
  }

  async findById(id: string): Promise<PostRecord | null> {
    const post = this.store.posts.get(id)
    return post ? copyPost(post) : null
  }

  async list(input: { limit: number; cursor: FeedCursor | null; includeMembers: boolean }): Promise<PostRecord[]> {
    const rows = [...this.store.posts.values()].filter((post) => {
      if (!input.includeMembers && post.visibility !== 'public') return false
      if (!input.cursor) return true
      return isBeforeCursor(post, input.cursor)
    })
    rows.sort(compareNewestFirst)
    return rows.slice(0, input.limit).map(copyPost)
  }
}

function isBeforeCursor(post: PostRecord, cursor: FeedCursor): boolean {
  const cursorTime = Date.parse(cursor.createdAt)
  const postTime = post.createdAt.getTime()
  if (postTime < cursorTime) return true
  if (postTime > cursorTime) return false
  return post.id < cursor.id
}

function compareNewestFirst(a: PostRecord, b: PostRecord): number {
  const time = b.createdAt.getTime() - a.createdAt.getTime()
  if (time !== 0) return time
  if (a.id === b.id) return 0
  return a.id < b.id ? 1 : -1
}
