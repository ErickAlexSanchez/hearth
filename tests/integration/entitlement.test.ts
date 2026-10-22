import { GET as readOne } from '@/app/api/feed/[id]/route'
import { GET as readFeed, POST as publish } from '@/app/api/feed/route'
import { getContainer } from '@/composition/container'
import { authed, readBody, removeUser, signUpUser } from './helpers'

const secret = 'members-only-habit-note-alpha'

describe('entitlement', () => {
  const users: string[] = []

  afterEach(async () => {
    for (const userId of users) {
      await removeUser(userId)
    }
    users.length = 0
  })

  it('returns 403 when a free user reads a members-only post', async () => {
    const free = await signUpUser('Free Reader')
    const member = await signUpUser('Member Writer')
    users.push(free.userId, member.userId)
    await getContainer().memberships.setTier(member.userId, 'member', new Date())

    const created = await publish(
      authed('/api/feed', member.cookie, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: secret, visibility: 'members' }),
      }),
    )
    const createdBody = await readBody(created)
    expect(created.status).toBe(201)
    const postId = readPostId(createdBody)

    const forbidden = await readOne(authed(`/api/feed/${postId}`, free.cookie), {
      params: Promise.resolve({ id: postId }),
    })
    const forbiddenText = await forbidden.text()
    expect(forbidden.status).toBe(403)
    expect(forbiddenText).not.toContain(secret)

    const allowed = await readOne(authed(`/api/feed/${postId}`, member.cookie), {
      params: Promise.resolve({ id: postId }),
    })
    const allowedBody = await readBody(allowed)
    expect(allowed.status).toBe(200)
    expect(JSON.stringify(allowedBody)).toContain(secret)

    const listed = await readFeed(authed('/api/feed', free.cookie))
    const listedText = await listed.text()
    expect(listed.status).toBe(200)
    expect(listedText).not.toContain(secret)

    const memberList = await readFeed(authed('/api/feed', member.cookie))
    const memberListText = await memberList.text()
    expect(memberList.status).toBe(200)
    expect(memberListText).toContain(secret)
  })

  it('returns 401 for an anonymous read and 403 when a free user publishes to members', async () => {
    const free = await signUpUser('Free Writer')
    users.push(free.userId)
    const anonymous = await readFeed(new Request('http://localhost/api/feed'))
    expect(anonymous.status).toBe(401)

    const denied = await publish(
      authed('/api/feed', free.cookie, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: 'A public-looking members post', visibility: 'members' }),
      }),
    )
    expect(denied.status).toBe(403)
  })
})

function readPostId(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'post' in payload) {
    const post = payload.post
    if (typeof post === 'object' && post !== null && 'id' in post && typeof post.id === 'string') {
      return post.id
    }
  }
  throw new Error('publish response missing post id')
}
