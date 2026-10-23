import './load-env'
import { signWebhook } from '../src/adapters/http/webhook-signature'
import { assertUuid } from '../src/domain/ids'
import { getEnv } from '../src/composition/env'
import { writeSafeError } from './safe-error'

async function main(): Promise<void> {
  const userId = process.argv[2]
  if (!userId) {
    process.stderr.write('Usage: pnpm simulate:membership -- <user-id>\n')
    process.exitCode = 1
    return
  }
  assertUuid(userId)
  const env = getEnv()
  const raw = JSON.stringify({
    type: 'checkout.session.completed',
    data: { userId },
  })
  const timestamp = Math.floor(Date.now() / 1000)
  const header = signWebhook(env.WEBHOOK_SECRET, raw, timestamp)
  const response = await fetch('http://127.0.0.1:3301/api/webhooks/stripe', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': header,
    },
    body: raw,
  })
  const text = await response.text()
  process.stdout.write(`${response.status} ${text}\n`)
  if (!response.ok) process.exitCode = 1
}

main().catch((error: unknown) => {
  writeSafeError(error)
  process.exitCode = 1
})
