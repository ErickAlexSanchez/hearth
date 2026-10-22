import { GET as readSession } from '@/app/api/session/route'
import { POST as webhook } from '@/app/api/webhooks/stripe/route'
import { signWebhook } from '@/adapters/http/webhook-signature'
import { getContainer } from '@/composition/container'
import { authed, readBody, removeUser, signUpUser } from './helpers'

describe('membership webhook', () => {
  it('rejects a bad signature and accepts a signed checkout', async () => {
    const user = await signUpUser('Future Member')
    try {
      const raw = JSON.stringify({
        type: 'checkout.session.completed',
        data: { userId: user.userId },
      })
      const now = Math.floor(Date.now() / 1000)
      const bad = await webhook(
        new Request('http://localhost/api/webhooks/stripe', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'stripe-signature': `t=${now},v1=${'ab'.repeat(32)}`,
          },
          body: raw,
        }),
      )
      expect(bad.status).toBe(401)
      expect(await tierOf(user.cookie)).toBe('free')

      const header = signWebhook(getContainer().env.WEBHOOK_SECRET, raw, now)
      const good = await webhook(
        new Request('http://localhost/api/webhooks/stripe', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'stripe-signature': header,
          },
          body: raw,
        }),
      )
      expect(good.status).toBe(200)
      expect(await tierOf(user.cookie)).toBe('member')
    } finally {
      await removeUser(user.userId)
    }
  })
})

async function tierOf(cookie: string): Promise<string> {
  const response = await readSession(authed('/api/session', cookie))
  const body = await readBody(response)
  if (typeof body === 'object' && body !== null && 'user' in body) {
    const user = body.user
    if (typeof user === 'object' && user !== null && 'tier' in user && typeof user.tier === 'string') {
      return user.tier
    }
  }
  throw new Error('session response missing tier')
}
