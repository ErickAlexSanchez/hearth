export type CoachRole = 'user' | 'coach'

export type CoachMessageRecord = {
  id: string
  userId: string
  role: CoachRole
  body: string
  createdAt: Date
}

export interface CoachRepository {
  insert(message: CoachMessageRecord): Promise<void>
  listByUser(userId: string, limit: number): Promise<CoachMessageRecord[]>
  deleteOlderThan(cutoff: Date): Promise<number>
}
