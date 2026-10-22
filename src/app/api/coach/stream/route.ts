import { beginCoachTurn, finishCoachTurn } from '@/application/coach/turns'
import { handleRoute } from '@/adapters/http/handle-route'
import { parseWith, readJson } from '@/adapters/http/json'
import { requireUser } from '@/adapters/http/require-user'
import { coachTurnSchema } from '@/contracts/schemas'
import { getContainer } from '@/composition/container'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  const container = getContainer()
  return handleRoute(request, container.logger, async (requestId) => {
    const user = await requireUser(request, container)
    const body = parseWith(coachTurnSchema, await readJson(request), 'The habit question is invalid.')
    const prepared = await beginCoachTurn(container, { userId: user.id, text: body.text })
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const parts: string[] = []
        try {
          for await (const token of container.responder.reply({ userText: prepared.text })) {
            parts.push(token)
            controller.enqueue(encoder.encode(sse('token', { text: token })))
          }
          await finishCoachTurn(container, { userId: user.id, text: parts.join('') })
          controller.enqueue(encoder.encode(sse('done', {})))
          controller.close()
        } catch (error) {
          container.logger.error('coach.stream_failed', {
            requestId,
            name: error instanceof Error ? error.name : 'Error',
          })
          controller.enqueue(
            encoder.encode(sse('error', { message: 'The coach could not reply. Try again.' })),
          )
          controller.close()
        }
      },
    })
    return new Response(stream, {
      headers: {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-store',
        'x-accel-buffering': 'no',
      },
    })
  })
}

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}
