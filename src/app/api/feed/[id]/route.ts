import { readPost } from '@/application/feed/read-post'
import { handleRoute } from '@/adapters/http/handle-route'
import { jsonResponse } from '@/adapters/http/json'
import { requireUser } from '@/adapters/http/require-user'
import { getContainer } from '@/composition/container'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: Context): Promise<Response> {
  const container = getContainer()
  return handleRoute(request, container.logger, async () => {
    const user = await requireUser(request, container)
    const { id } = await context.params
    const post = await readPost(container, { userId: user.id, postId: id })
    return jsonResponse({ post }, 200, 'private, no-store')
  })
}
