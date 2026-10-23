import { DomainError } from '@/domain/errors'
import { insertMembership, insertSession, insertUser, removeUser, type MemoryStore } from '@/adapters/memory/store'
import type { AccountWriter } from '@/ports/account-writer'

export function createMemoryAccountWriter(store: MemoryStore): AccountWriter {
  return {
    async createAccount(input) {
      if (
        store.usersByEmail.has(input.user.email) ||
        store.users.has(input.user.id) ||
        store.memberships.has(input.membership.userId) ||
        store.sessions.has(input.session.tokenHash)
      ) {
        throw new DomainError('VALIDATION', 'An account with that email already exists.')
      }
      insertUser(store, input.user)
      try {
        insertMembership(store, input.membership)
        insertSession(store, input.session)
      } catch (error) {
        removeUser(store, input.user.id)
        throw error
      }
    },
  }
}
