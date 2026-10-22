import { retainCoachMessages } from '@/application/coach/retain-coach'
import { getContainer } from '@/composition/container'
import { removeUser, signUpUser } from './helpers'

describe('coach retention', () => {
  it('deletes old coach messages and keeps the feed post', async () => {
    const user = await signUpUser('Retention User')
    const container = getContainer()
    const now = new Date()
    const postId = crypto.randomUUID()
    const oldId = crypto.randomUUID()
    const recentId = crypto.randomUUID()
    try {
      await container.feedWrites.insert({
        id: postId,
        authorId: user.userId,
        body: 'A feed post that retention must keep.',
        visibility: 'public',
        createdAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
      })
      await container.coach.insert({
        id: oldId,
        userId: user.userId,
        role: 'user',
        body: 'An old habit note that should be deleted.',
        createdAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
      })
      await container.coach.insert({
        id: recentId,
        userId: user.userId,
        role: 'user',
        body: 'A recent habit note that should stay.',
        createdAt: now,
      })

      const result = await retainCoachMessages(container, { retentionDays: 30, requestId: 'retention-test' })
      expect(result.deleted).toBeGreaterThanOrEqual(1)

      const messages = await container.coach.listByUser(user.userId, 50)
      expect(messages.map((message) => message.id)).not.toContain(oldId)
      expect(messages.map((message) => message.id)).toContain(recentId)
      const post = await container.feedReads.findById(postId)
      expect(post?.body).toBe('A feed post that retention must keep.')
    } finally {
      await removeUser(user.userId)
    }
  })
})
