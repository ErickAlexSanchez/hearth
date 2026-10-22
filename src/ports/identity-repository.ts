export type UserRecord = {
  id: string
  email: string
  displayName: string
  passwordHash: string
  createdAt: Date
}

export type SessionRecord = {
  tokenHash: string
  userId: string
  createdAt: Date
  expiresAt: Date
}

export interface IdentityRepository {
  insertUser(user: UserRecord): Promise<void>
  findUserByEmail(email: string): Promise<UserRecord | null>
  findUserById(id: string): Promise<UserRecord | null>
  findUsersByIds(ids: readonly string[]): Promise<UserRecord[]>
  insertSession(session: SessionRecord): Promise<void>
  findSession(tokenHash: string): Promise<SessionRecord | null>
  deleteSession(tokenHash: string): Promise<void>
  deleteUser(id: string): Promise<void>
}
