import { GET as readThread } from '@/app/api/coach/messages/route'
import { POST as streamCoach } from '@/app/api/coach/stream/route'
import { getContainer } from '@/composition/container'
import { authed, removeUser, signUpUser } from './helpers'

describe('coach stream', () => {
  const users: string[] = []

  afterEach(async () => {
    for (const userId of users) await removeUser(userId)
    users.length = 0
  })

  it('sets cache-control no-store', async () => {
    const user = await signUpUser('Stream User')
    users.push(user.userId)
    const response = await streamCoach(
      authed('/api/coach/stream', user.cookie, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: 'Help me keep a short evening walk' }),
      }),
    )
    expect(response.headers.get('cache-control')).toBe('no-store')
    const text = await response.text()
    expect(response.status).toBe(200)
    expect(text).toContain('event: token')
    expect(text.toLowerCase()).not.toContain('diagnos')
    expect(text).not.toMatch(/\b\d+\s*mg\b/i)
  })

  it('does not return another person\'s coach notes', async () => {
    const owner = await signUpUser('Note Owner')
    const other = await signUpUser('Other Person')
    users.push(owner.userId, other.userId)
    const privateNote = 'A private stretching note for the owner only.'
    await getContainer().coach.insert({
      id: crypto.randomUUID(),
      userId: owner.userId,
      role: 'user',
      body: privateNote,
      createdAt: new Date(),
    })
    const response = await readThread(authed('/api/coach/messages', other.cookie))
    const text = await response.text()
    expect(response.status).toBe(200)
    expect(text).not.toContain(privateNote)
  })
})
