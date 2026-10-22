import type { Pool } from 'pg'
import { queryRows } from '@/adapters/postgres/query'
import type { FeedCursor } from '@/domain/feed/cursor'
import type { Visibility } from '@/domain/membership/entitlement'
import type { FeedRepository, PostRecord } from '@/ports/feed-repository'

type PostRow = {
  id: string
  author_id: string
  body: string
  visibility: string
  created_at: Date
}

function toVisibility(value: string): Visibility {
  if (value === 'public' || value === 'members') return value
  throw new Error('Unexpected post visibility.')
}

function toPost(row: PostRow): PostRecord {
  return {
    id: row.id,
    authorId: row.author_id,
    body: row.body,
    visibility: toVisibility(row.visibility),
    createdAt: row.created_at,
  }
}

export class PgFeedRepository implements FeedRepository {
  readonly connectionString: string

  constructor(
    private readonly pool: Pool,
    connectionString: string,
  ) {
    this.connectionString = connectionString
  }

  async insert(post: PostRecord): Promise<void> {
    await queryRows(this.pool, `
      insert into feed.posts (id, author_id, body, visibility, created_at)
      values ($1, $2, $3, $4, $5)
    `, [post.id, post.authorId, post.body, post.visibility, post.createdAt])
  }

  async findById(id: string): Promise<PostRecord | null> {
    const result = await queryRows<PostRow>(this.pool, `
      select id, author_id, body, visibility, created_at
      from feed.posts
      where id = $1
    `, [id])
    const row = result.rows[0]
    return row ? toPost(row) : null
  }

  async list(input: { limit: number; cursor: FeedCursor | null; includeMembers: boolean }): Promise<PostRecord[]> {
    const result = await queryRows<PostRow>(this.pool, `
      select id, author_id, body, visibility, created_at
      from feed.posts
      where ($1::boolean or visibility = 'public')
        and (
          $2::timestamptz is null
          or (created_at, id) < ($2::timestamptz, $3::uuid)
        )
      order by created_at desc, id desc
      limit $4
    `, [
      input.includeMembers,
      input.cursor ? new Date(input.cursor.createdAt) : null,
      input.cursor?.id ?? null,
      input.limit,
    ])
    return result.rows.map(toPost)
  }
}
