import type { CoachMessageRecord } from '@/ports/coach-repository'
import type { PostRecord } from '@/ports/feed-repository'
import type { SessionRecord, UserRecord } from '@/ports/identity-repository'
import type { MembershipRecord } from '@/ports/membership-repository'

export type MemoryStore = {
  users: Map<string, UserRecord>
  usersByEmail: Map<string, string>
  sessions: Map<string, SessionRecord>
  revokedSessions: Set<string>
  memberships: Map<string, MembershipRecord>
  posts: Map<string, PostRecord>
  coachMessages: CoachMessageRecord[]
}

export function createMemoryStore(): MemoryStore {
  return {
    users: new Map(),
    usersByEmail: new Map(),
    sessions: new Map(),
    revokedSessions: new Set(),
    memberships: new Map(),
    posts: new Map(),
    coachMessages: [],
  }
}

export function copyUser(user: UserRecord): UserRecord {
  return { ...user, createdAt: new Date(user.createdAt.getTime()) }
}

export function copySession(session: SessionRecord): SessionRecord {
  return {
    ...session,
    createdAt: new Date(session.createdAt.getTime()),
    expiresAt: new Date(session.expiresAt.getTime()),
  }
}

export function copyMembership(membership: MembershipRecord): MembershipRecord {
  return { ...membership, updatedAt: new Date(membership.updatedAt.getTime()) }
}

export function copyPost(post: PostRecord): PostRecord {
  return { ...post, createdAt: new Date(post.createdAt.getTime()) }
}

export function copyCoachMessage(message: CoachMessageRecord): CoachMessageRecord {
  return { ...message, createdAt: new Date(message.createdAt.getTime()) }
}

export function insertUser(store: MemoryStore, user: UserRecord): void {
  if (store.users.has(user.id) || store.usersByEmail.has(user.email)) {
    throw new Error('Duplicate user.')
  }
  store.users.set(user.id, copyUser(user))
  store.usersByEmail.set(user.email, user.id)
}

export function insertSession(store: MemoryStore, session: SessionRecord): void {
  store.revokedSessions.delete(session.tokenHash)
  store.sessions.set(session.tokenHash, copySession(session))
}

export function insertMembership(store: MemoryStore, membership: MembershipRecord): void {
  if (store.memberships.has(membership.userId)) {
    throw new Error('Duplicate membership.')
  }
  store.memberships.set(membership.userId, copyMembership(membership))
}

export function insertPost(store: MemoryStore, post: PostRecord): void {
  if (store.posts.has(post.id)) throw new Error('Duplicate post.')
  store.posts.set(post.id, copyPost(post))
}

export function insertCoachMessage(store: MemoryStore, message: CoachMessageRecord): void {
  store.coachMessages.push(copyCoachMessage(message))
}

export function removeUser(store: MemoryStore, id: string): void {
  const user = store.users.get(id)
  if (user) store.usersByEmail.delete(user.email)
  store.users.delete(id)
  for (const [token, session] of [...store.sessions.entries()]) {
    if (session.userId === id) store.sessions.delete(token)
  }
  store.memberships.delete(id)
  for (const [postId, post] of [...store.posts.entries()]) {
    if (post.authorId === id) store.posts.delete(postId)
  }
  store.coachMessages = store.coachMessages.filter((message) => message.userId !== id)
}
