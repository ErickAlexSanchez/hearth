import { GET as readFeed } from '@/app/api/feed/route'
import { getContainer } from '@/composition/container'
import { authed, readBody, removeUser, signUpUser } from './helpers'

describe('feed cursor', () => {
  it('pages without repeating posts', async () => {
    const user = await signUpUser('Cursor User')
    const container = getContainer()
    const base = Date.now() + 24 * 60 * 60 * 1000
    try {
      await container.feedWrites.insert({
        id: crypto.randomUUID(),
        authorId: user.userId,
        body: 'cursor-oldest-marker',
        visibility: 'public',
        createdAt: new Date(base),
      })
      await container.feedWrites.insert({
        id: crypto.randomUUID(),
        authorId: user.userId,
        body: 'cursor-middle-marker',
        visibility: 'public',
        createdAt: new Date(base + 1000),
      })
      await container.feedWrites.insert({
        id: crypto.randomUUID(),
        authorId: user.userId,
        body: 'cursor-newest-marker',
        visibility: 'public',
        createdAt: new Date(base + 2000),
      })

      const firstResponse = await readFeed(authed('/api/feed?limit=2', user.cookie))
      const first = await readBody(firstResponse)
      expect(firstResponse.status).toBe(200)
      const firstPage = asPage(first)
      expect(firstPage.posts.map((post) => post.body)).toEqual(['cursor-newest-marker', 'cursor-middle-marker'])
      expect(firstPage.nextCursor).toEqual(expect.any(String))

      const secondResponse = await readFeed(authed(`/api/feed?limit=2&cursor=${firstPage.nextCursor ?? ''}`, user.cookie))
      const second = asPage(await readBody(secondResponse))
      const firstIds = new Set(firstPage.posts.map((post) => post.id))
      for (const post of second.posts) {
        expect(firstIds.has(post.id)).toBe(false)
      }
      expect(second.posts.some((post) => post.body === 'cursor-oldest-marker')).toBe(true)

      const invalid = await readFeed(authed('/api/feed?cursor=not-a-cursor', user.cookie))
      expect(invalid.status).toBe(400)
    } finally {
      await removeUser(user.userId)
    }
  })
})

function asPage(payload: unknown): { posts: { id: string; body: string }[]; nextCursor: string | null } {
  if (typeof payload !== 'object' || payload === null || !('posts' in payload) || !('nextCursor' in payload)) {
    throw new Error('feed page shape')
  }
  const posts = payload.posts
  const nextCursor = payload.nextCursor
  if (!Array.isArray(posts) || (typeof nextCursor !== 'string' && nextCursor !== null)) {
    throw new Error('feed page shape')
  }
  return {
    posts: posts.map((post) => {
      if (typeof post !== 'object' || post === null || !('id' in post) || !('body' in post)) {
        throw new Error('feed post shape')
      }
      if (typeof post.id !== 'string' || typeof post.body !== 'string') throw new Error('feed post shape')
      return { id: post.id, body: post.body }
    }),
    nextCursor,
  }
}
