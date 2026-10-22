import { DomainError } from '@/domain/errors'
import type { ZodType } from 'zod'

export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new DomainError('VALIDATION', 'Content-Type must be application/json.')
  }
  try {
    return (await request.json()) as unknown
  } catch (error) {
    if (error instanceof DomainError) throw error
    throw new DomainError('VALIDATION', 'The request body is invalid.')
  }
}

export function parseWith<T>(schema: ZodType<T>, value: unknown, message: string): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new DomainError('VALIDATION', message)
  }
  return result.data
}

export function jsonResponse(
  body: unknown,
  status: number,
  cacheControl: string,
  extra?: Record<string, string>,
): Response {
  const headers = new Headers(extra)
  headers.set('content-type', 'application/json; charset=utf-8')
  headers.set('cache-control', cacheControl)
  return new Response(JSON.stringify(body), { status, headers })
}
