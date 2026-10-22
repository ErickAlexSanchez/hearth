import type { FeedCursor } from '@/domain/feed/cursor'
import type { Visibility } from '@/domain/membership/entitlement'

export type PostRecord = {
  id: string
  authorId: string
  body: string
  visibility: Visibility
  createdAt: Date
}

export interface FeedRepository {
  insert(post: PostRecord): Promise<void>
  findById(id: string): Promise<PostRecord | null>
  list(input: { limit: number; cursor: FeedCursor | null; includeMembers: boolean }): Promise<PostRecord[]>
}
