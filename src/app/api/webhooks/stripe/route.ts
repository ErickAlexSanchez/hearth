import { applyMembershipCheckout } from '@/application/membership/apply-checkout'
import { handleRoute } from '@/adapters/http/handle-route'
import { jsonResponse, parseWith } from '@/adapters/http/json'
import { verifyWebhookSignature } from '@/adapters/http/webhook-signature'
import { checkoutWebhookSchema } from '@/contracts/schemas'
import { getContainer } from '@/composition/container'
import { DomainError } from '@/domain/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  const container = getContainer()
  return handleRoute(request, container.logger, async (requestId) => {
    const raw = await request.text()
    const header = request.headers.get('stripe-signature')
    if (!header) throw new DomainError('UNAUTHORIZED', 'Invalid signature.')
    verifyWebhookSignature({
      secret: container.env.WEBHOOK_SECRET,
      rawBody: raw,
      header,
      nowSeconds: Math.floor(container.clock.now().getTime() / 1000),
    })
    const payload = parseWebhook(raw)
    const event = parseWith(checkoutWebhookSchema, payload, 'The webhook payload is invalid.')
    const result = await applyMembershipCheckout(container, event.data.userId)
    container.logger.info('membership.checkout_applied', { requestId, tier: result.tier })
    return jsonResponse({ ok: true, tier: result.tier }, 200, 'no-store')
  })
}

function parseWebhook(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new DomainError('VALIDATION', 'The webhook payload is invalid.')
    }
    throw error
  }
}
