import { readCoachThread } from '@/application/coach/turns'
import { handleRoute } from '@/adapters/http/handle-route'
import { jsonResponse } from '@/adapters/http/json'
import { requireUser } from '@/adapters/http/require-user'
import { getContainer } from '@/composition/container'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const container = getContainer()
  return handleRoute(request, container.logger, async () => {
    const user = await requireUser(request, container)
    const thread = await readCoachThread(container, { userId: user.id })
    return jsonResponse(thread, 200, 'private, no-store')
  })
}
