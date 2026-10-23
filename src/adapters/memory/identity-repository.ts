import { openSealedSession } from '@/adapters/crypto/session-seal'
import {
  copySession,
  copyUser,
  insertSession,
  insertUser,
  removeUser,
  type MemoryStore,
} from '@/adapters/memory/store'
import type { IdentityRepository, SessionRecord, UserRecord } from '@/ports/identity-repository'

export class MemoryIdentityRepository implements IdentityRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly sessionSecret: string,
  ) {}

  async insertUser(user: UserRecord): Promise<void> {
    insertUser(this.store, user)
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const id = this.store.usersByEmail.get(email)
    if (!id) return null
    const user = this.store.users.get(id)
    return user ? copyUser(user) : null
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const user = this.store.users.get(id)
    return user ? copyUser(user) : null
  }

  async findUsersByIds(ids: readonly string[]): Promise<UserRecord[]> {
    const found: UserRecord[] = []
    for (const id of ids) {
      const user = this.store.users.get(id)
      if (user) found.push(copyUser(user))
    }
    return found
  }

  async insertSession(session: SessionRecord): Promise<void> {
    insertSession(this.store, session)
  }

  async findSession(tokenHash: string): Promise<SessionRecord | null> {
    if (this.store.revokedSessions.has(tokenHash)) return null
    const stored = this.store.sessions.get(tokenHash)
    if (stored) return copySession(stored)
    const opened = openSealedSession(tokenHash, this.sessionSecret)
    if (!opened) return null
    return {
      tokenHash,
      userId: opened.userId,
      createdAt: opened.createdAt,
      expiresAt: opened.expiresAt,
    }
  }

  async deleteSession(tokenHash: string): Promise<void> {
    this.store.sessions.delete(tokenHash)
    this.store.revokedSessions.add(tokenHash)
  }

  async deleteUser(id: string): Promise<void> {
    removeUser(this.store, id)
  }
}
