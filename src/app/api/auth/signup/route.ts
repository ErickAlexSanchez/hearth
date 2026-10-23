import { signUp } from '@/application/auth/accounts'
import { handleRoute } from '@/adapters/http/handle-route'
import { jsonResponse, parseWith, readJson } from '@/adapters/http/json'
import { secureCookies, sessionCookie } from '@/adapters/http/session-cookie'
import { signUpSchema } from '@/contracts/schemas'
import { getContainer } from '@/composition/container'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  const container = getContainer()
  return handleRoute(request, container.logger, async () => {
    const body = parseWith(signUpSchema, await readJson(request), 'The account details are invalid.')
    const signedIn = await signUp(container, body)
    return jsonResponse({ user: signedIn.user }, 201, 'private, no-store', {
      'set-cookie': sessionCookie(
        container.issueSessionCookie({
          sessionToken: signedIn.sessionToken,
          userId: signedIn.user.id,
        }),
        secureCookies(),
      ),
    })
  })
}
