export const SESSION_COOKIE = 'hearth_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 14

export function readSessionToken(request: Request): string | null {
  const header = request.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator === -1) continue
    const name = part.slice(0, separator).trim()
    if (name !== SESSION_COOKIE) continue
    const value = part.slice(separator + 1).trim()
    if (!value) return null
    try {
      return decodeURIComponent(value)
    } catch (error) {
      if (error instanceof URIError) return null
      throw error
    }
  }
  return null
}

export function sessionCookie(token: string, secure: boolean): string {
  return cookieHeader(encodeURIComponent(token), SESSION_MAX_AGE, secure)
}

export function clearSessionCookie(secure: boolean): string {
  return cookieHeader('', 0, secure)
}

function cookieHeader(value: string, maxAge: number, secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE}=${value}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

export function secureCookies(): boolean {
  return process.env.NODE_ENV === 'production'
}
