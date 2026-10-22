import { readSession } from '@/application/auth/accounts'
import type { PublicUser } from '@/application/auth/accounts'
import { DomainError } from '@/domain/errors'
import type { Clock } from '@/ports/clock'
import type { IdentityRepository } from '@/ports/identity-repository'
import type { MembershipRepository } from '@/ports/membership-repository'
import type { TokenHasher } from '@/ports/token-hasher'
import { readSessionToken } from '@/adapters/http/session-cookie'

export async function requireUser(
  request: Request,
  deps: {
    identity: IdentityRepository
    memberships: MembershipRepository
    tokens: TokenHasher
    clock: Clock
  },
): Promise<PublicUser> {
  const token = readSessionToken(request)
  if (!token) {
    throw new DomainError('UNAUTHORIZED', 'Sign in required.')
  }
  const user = await readSession(deps, token)
  if (!user) {
    throw new DomainError('UNAUTHORIZED', 'Sign in required.')
  }
  return user
}
