import { jsonResponse } from '@/adapters/http/json'
import { handleRoute } from '@/adapters/http/handle-route'
import { getContainer } from '@/composition/container'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  try {
    const container = getContainer()
    return handleRoute(request, container.logger, async (requestId) => {
      try {
        await container.ping()
      } catch (error) {
        container.logger.error('health.database', {
          requestId,
          name: error instanceof Error ? error.name : 'Error',
        })
        return jsonResponse({ status: 'unavailable' }, 503, 'no-store')
      }
      return jsonResponse({ status: 'ok' }, 200, 'no-store')
    })
  } catch (error) {
    if (error instanceof Error) {
      return jsonResponse({ status: 'unavailable' }, 503, 'no-store')
    }
    return jsonResponse({ status: 'unavailable' }, 503, 'no-store')
  }
}
