import {
  coachThreadSchema,
  feedPageSchema,
  feedPostSchema,
  sessionSchema,
  type CoachThreadJson,
  type FeedPageJson,
  type FeedPostJson,
  type PublicUserJson,
} from '@/contracts/schemas'

export class ApiError extends Error {
  constructor(message: string, errorName: string) {
    super(message)
    this.name = errorName
  }
}

export async function fetchSession(): Promise<{ user: PublicUserJson | null }> {
  const response = await fetch('/api/session')
  if (response.status === 401) return { user: null }
  if (!response.ok) throw new ApiError('Could not load your session.', 'SessionError')
  const parsed = sessionSchema.safeParse(await readUnknown(response))
  if (!parsed.success) throw new ApiError('Could not load your session.', 'SessionError')
  return { user: parsed.data.user }
}

export async function fetchFeedPage(cursor: string | null): Promise<FeedPageJson> {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  const response = await fetch(`/api/feed?${params.toString()}`)
  if (response.status === 401) throw new ApiError('Sign in required.', 'UnauthorizedError')
  if (!response.ok) throw new ApiError('Could not load the feed.', 'FeedError')
  const parsed = feedPageSchema.safeParse(await readUnknown(response))
  if (!parsed.success) throw new ApiError('Could not load the feed.', 'FeedError')
  return parsed.data
}

export async function fetchPost(id: string): Promise<FeedPostJson> {
  const response = await fetch(`/api/feed/${id}`)
  if (response.status === 401) throw new ApiError('Sign in required.', 'UnauthorizedError')
  if (response.status === 403) throw new ApiError('This post is for members.', 'ForbiddenError')
  if (response.status === 404) throw new ApiError('This post is not available.', 'NotFoundError')
  if (!response.ok) throw new ApiError('Could not load this post.', 'PostError')
  const payload = await readUnknown(response)
  if (!isRecord(payload) || !('post' in payload)) {
    throw new ApiError('Could not load this post.', 'PostError')
  }
  const parsed = feedPostSchema.safeParse(payload.post)
  if (!parsed.success) throw new ApiError('Could not load this post.', 'PostError')
  return parsed.data
}

export async function fetchCoachThread(): Promise<CoachThreadJson> {
  const response = await fetch('/api/coach/messages')
  if (response.status === 401) throw new ApiError('Sign in required.', 'UnauthorizedError')
  if (!response.ok) throw new ApiError('Could not load your habit notes.', 'CoachError')
  const parsed = coachThreadSchema.safeParse(await readUnknown(response))
  if (!parsed.success) throw new ApiError('Could not load your habit notes.', 'CoachError')
  return parsed.data
}

export async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await readUnknown(response)
    if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === 'string') {
      return payload.error.message
    }
  } catch (error) {
    if (error instanceof ApiError) return fallback
    return fallback
  }
  return fallback
}

export async function readCoachStream(response: Response, onToken: (token: string) => void): Promise<void> {
  if (!response.body) throw new ApiError('The coach could not reply. Try again.', 'CoachError')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const chunk = await reader.read()
      if (chunk.done) break
      buffer += decoder.decode(chunk.value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() ?? ''
      for (const part of parts) {
        consumeEvent(part, onToken)
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function consumeEvent(part: string, onToken: (token: string) => void): void {
  let event = 'message'
  const dataLines: string[] = []
  for (const line of part.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }
  if (dataLines.length === 0) return
  let payload: unknown
  try {
    payload = JSON.parse(dataLines.join('\n')) as unknown
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ApiError('The coach could not reply. Try again.', 'CoachError')
    }
    throw error
  }
  if (event === 'error') throw new ApiError('The coach could not reply. Try again.', 'CoachError')
  if (event === 'token' && isRecord(payload) && typeof payload.text === 'string') onToken(payload.text)
}

async function readUnknown(response: Response): Promise<unknown> {
  const text = await response.text()
  try {
    return JSON.parse(text) as unknown
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ApiError('The server sent an unreadable response.', 'ResponseError')
    }
    throw error
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
