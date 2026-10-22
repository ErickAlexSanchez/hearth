import { publishPost } from '@/application/feed/publish-post'
import { readFeed } from '@/application/feed/read-feed'
import { handleRoute } from '@/adapters/http/handle-route'
import { jsonResponse, parseWith, readJson } from '@/adapters/http/json'
import { requireUser } from '@/adapters/http/require-user'
import { feedQuerySchema, publishPostSchema } from '@/contracts/schemas'
import { getContainer } from '@/composition/container'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const container = getContainer()
  return handleRoute(request, container.logger, async () => {
    const user = await requireUser(request, container)
    const url = new URL(request.url)
    const cursorParam = url.searchParams.get('cursor')
    const limitParam = url.searchParams.get('limit')
    const query = parseWith(
      feedQuerySchema,
      {
        cursor: cursorParam && cursorParam.length > 0 ? cursorParam : undefined,
        limit: limitParam === null || limitParam.length === 0 ? undefined : Number(limitParam),
      },
      'The feed query is invalid.',
    )
    const page = await readFeed(container, {
      userId: user.id,
      cursor: query.cursor ?? null,
      limit: query.limit ?? 10,
    })
    return jsonResponse(page, 200, 'private, no-store')
  })
}

export async function POST(request: Request): Promise<Response> {
  const container = getContainer()
  return handleRoute(request, container.logger, async () => {
    const user = await requireUser(request, container)
    const body = parseWith(publishPostSchema, await readJson(request), 'The post is invalid.')
    const post = await publishPost(container, {
      userId: user.id,
      displayName: user.displayName,
      body: body.body,
      visibility: body.visibility,
    })
    return jsonResponse({ post }, 201, 'private, no-store')
  })
}
