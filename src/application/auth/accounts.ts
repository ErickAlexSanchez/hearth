import { DomainError } from '@/domain/errors'
import { assertDisplayName, assertEmail, assertPassword } from '@/domain/identity/account'
import type { Tier } from '@/domain/membership/entitlement'
import type { AccountWriter } from '@/ports/account-writer'
import type { Clock } from '@/ports/clock'
import type { IdGenerator } from '@/ports/id-generator'
import type { IdentityRepository } from '@/ports/identity-repository'
import type { MembershipRepository } from '@/ports/membership-repository'
import type { PasswordHasher } from '@/ports/password-hasher'
import type { TokenHasher } from '@/ports/token-hasher'

const SESSION_MS = 14 * 24 * 60 * 60 * 1000

export type PublicUser = {
  id: string
  email: string
  displayName: string
  tier: Tier
}

export type SignedIn = {
  sessionToken: string
  user: PublicUser
}

export type AuthDeps = {
  accounts: AccountWriter
  identity: IdentityRepository
  memberships: MembershipRepository
  hasher: PasswordHasher
  tokens: TokenHasher
  ids: IdGenerator
  clock: Clock
}

function sessionExpiry(now: Date): Date {
  return new Date(now.getTime() + SESSION_MS)
}

export async function signUp(
  deps: AuthDeps,
  input: { email: string; password: string; displayName: string },
): Promise<SignedIn> {
  const email = assertEmail(input.email)
  assertPassword(input.password)
  const displayName = assertDisplayName(input.displayName)
  const now = deps.clock.now()
  const userId = deps.ids.uuid()
  const sessionToken = deps.ids.sessionToken()
  const passwordHash = await deps.hasher.hash(input.password)
  await deps.accounts.createAccount({
    user: {
      id: userId,
      email,
      displayName,
      passwordHash,
      createdAt: now,
    },
    membership: {
      userId,
      tier: 'free',
      updatedAt: now,
    },
    session: {
      tokenHash: deps.tokens.hash(sessionToken),
      userId,
      createdAt: now,
      expiresAt: sessionExpiry(now),
    },
  })
  return {
    sessionToken,
    user: { id: userId, email, displayName, tier: 'free' },
  }
}

export async function signIn(
  deps: AuthDeps,
  input: { email: string; password: string },
): Promise<SignedIn> {
  const email = assertEmail(input.email)
  assertPassword(input.password)
  const user = await deps.identity.findUserByEmail(email)
  const passwordHash = user?.passwordHash ?? 'missing'
  const matches = await deps.hasher.verify(input.password, passwordHash)
  if (!user || !matches) {
    throw new DomainError('UNAUTHORIZED', 'Email or password is incorrect.')
  }
  const membership = await deps.memberships.findByUserId(user.id)
  if (!membership) {
    throw new DomainError('UNAUTHORIZED', 'Email or password is incorrect.')
  }
  const now = deps.clock.now()
  const sessionToken = deps.ids.sessionToken()
  await deps.identity.insertSession({
    tokenHash: deps.tokens.hash(sessionToken),
    userId: user.id,
    createdAt: now,
    expiresAt: sessionExpiry(now),
  })
  return {
    sessionToken,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      tier: membership.tier,
    },
  }
}

export async function signOut(
  deps: { identity: IdentityRepository; tokens: TokenHasher },
  token: string | null,
): Promise<void> {
  if (!token) return
  await deps.identity.deleteSession(deps.tokens.hash(token))
}

export async function readSession(
  deps: {
    identity: IdentityRepository
    memberships: MembershipRepository
    tokens: TokenHasher
    clock: Clock
  },
  token: string,
): Promise<PublicUser | null> {
  const session = await deps.identity.findSession(deps.tokens.hash(token))
  if (!session) return null
  if (session.expiresAt.getTime() <= deps.clock.now().getTime()) {
    await deps.identity.deleteSession(session.tokenHash)
    return null
  }
  const [user, membership] = await Promise.all([
    deps.identity.findUserById(session.userId),
    deps.memberships.findByUserId(session.userId),
  ])
  if (!user || !membership) return null
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    tier: membership.tier,
  }
}
