import { signOut } from '@/application/auth/accounts'
import { handleRoute } from '@/adapters/http/handle-route'
import { jsonResponse } from '@/adapters/http/json'
import { clearSessionCookie, readSessionToken, secureCookies } from '@/adapters/http/session-cookie'
import { getContainer } from '@/composition/container'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  const container = getContainer()
  return handleRoute(request, container.logger, async () => {
    await signOut(container, readSessionToken(request))
    return jsonResponse({ ok: true }, 200, 'private, no-store', {
      'set-cookie': clearSessionCookie(secureCookies()),
    })
  })
}
