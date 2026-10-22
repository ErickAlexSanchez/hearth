import { DomainError, statusForDomainError } from '@/domain/errors'
import type { Logger } from '@/ports/logger'

export async function handleRoute(
  request: Request,
  logger: Logger,
  action: (requestId: string) => Promise<Response>,
): Promise<Response> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  const path = new URL(request.url).pathname
  logger.info('http.request', { requestId, method: request.method, path })
  try {
    const response = await action(requestId)
    logger.info('http.response', { requestId, status: response.status })
    return response
  } catch (error) {
    if (error instanceof DomainError) {
      logger.info('http.domain_error', { requestId, code: error.code })
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: statusForDomainError(error.code), headers: { 'cache-control': 'private, no-store' } },
      )
    }
    logger.error('http.unexpected', {
      requestId,
      name: error instanceof Error ? error.name : 'Error',
    })
    return Response.json(
      { error: { code: 'INTERNAL', message: 'Something went wrong.' } },
      { status: 500, headers: { 'cache-control': 'private, no-store' } },
    )
  }
}
