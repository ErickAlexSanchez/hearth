import { DomainError } from '@/domain/errors'
import { signWebhook, verifyWebhookSignature } from '@/adapters/http/webhook-signature'

const secret = 'test-webhook-secret'
const body = '{"type":"checkout.session.completed","data":{"userId":"11111111-1111-4111-8111-111111111111"}}'

describe('webhook signature', () => {
  const now = 1_700_000_000

  it('accepts a fresh signature from the same secret', () => {
    const header = signWebhook(secret, body, now)
    expect(() =>
      verifyWebhookSignature({ secret, rawBody: body, header, nowSeconds: now + 10 }),
    ).not.toThrow()
  })

  it('rejects a bad signature, a stale timestamp, and a tampered body', () => {
    const header = signWebhook(secret, body, now)
    expect(() =>
      verifyWebhookSignature({
        secret,
        rawBody: body,
        header: `t=${now},v1=${'ab'.repeat(32)}`,
        nowSeconds: now,
      }),
    ).toThrow(DomainError)
    expect(() =>
      verifyWebhookSignature({ secret, rawBody: body, header, nowSeconds: now + 301 }),
    ).toThrow(DomainError)
    expect(() =>
      verifyWebhookSignature({ secret, rawBody: `${body} `, header, nowSeconds: now }),
    ).toThrow(DomainError)
  })
})
