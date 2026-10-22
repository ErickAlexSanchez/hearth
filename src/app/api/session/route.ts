import { readSession } from '@/application/auth/accounts'
import { handleRoute } from '@/adapters/http/handle-route'
import { jsonResponse } from '@/adapters/http/json'
import { readSessionToken } from '@/adapters/http/session-cookie'
import { getContainer } from '@/composition/container'
import { DomainError } from '@/domain/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const container = getContainer()
  return handleRoute(request, container.logger, async () => {
    const token = readSessionToken(request)
    if (!token) throw new DomainError('UNAUTHORIZED', 'Sign in required.')
    const user = await readSession(container, token)
    if (!user) throw new DomainError('UNAUTHORIZED', 'Sign in required.')
    return jsonResponse({ user }, 200, 'private, no-store')
  })
}
