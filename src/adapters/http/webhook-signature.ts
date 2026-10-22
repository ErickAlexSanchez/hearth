import { createHmac, timingSafeEqual } from 'node:crypto'
import { DomainError } from '@/domain/errors'

const MAX_SKEW_SECONDS = 300

export function signWebhook(secret: string, rawBody: string, timestampSeconds: number): string {
  const digest = createHmac('sha256', secret).update(`${timestampSeconds}.${rawBody}`).digest('hex')
  return `t=${timestampSeconds},v1=${digest}`
}

export function verifyWebhookSignature(input: {
  secret: string
  rawBody: string
  header: string
  nowSeconds: number
}): void {
  const parts = readSignatureParts(input.header)
  if (!parts.t || !parts.v1) {
    throw new DomainError('UNAUTHORIZED', 'Invalid signature.')
  }
  const timestamp = Number(parts.t)
  if (!Number.isFinite(timestamp) || Math.abs(input.nowSeconds - timestamp) > MAX_SKEW_SECONDS) {
    throw new DomainError('UNAUTHORIZED', 'Invalid signature.')
  }
  const expected = createHmac('sha256', input.secret).update(`${parts.t}.${input.rawBody}`).digest('hex')
  const actual = Buffer.from(parts.v1)
  const wanted = Buffer.from(expected)
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) {
    throw new DomainError('UNAUTHORIZED', 'Invalid signature.')
  }
}

function readSignatureParts(header: string): { t: string | null; v1: string | null } {
  let t: string | null = null
  let v1: string | null = null
  for (const part of header.split(',')) {
    const separator = part.indexOf('=')
    if (separator === -1) continue
    const key = part.slice(0, separator).trim()
    const value = part.slice(separator + 1).trim()
    if (key === 't') t = value
    if (key === 'v1') v1 = value
  }
  return { t, v1 }
}
