import { copyCoachMessage, insertCoachMessage, type MemoryStore } from '@/adapters/memory/store'
import type { CoachMessageRecord, CoachRepository } from '@/ports/coach-repository'

export class MemoryCoachRepository implements CoachRepository {
  constructor(private readonly store: MemoryStore) {}

  async insert(message: CoachMessageRecord): Promise<void> {
    insertCoachMessage(this.store, message)
  }

  async listByUser(userId: string, limit: number): Promise<CoachMessageRecord[]> {
    const rows = this.store.coachMessages.filter((message) => message.userId === userId)
    rows.sort((a, b) => {
      const time = a.createdAt.getTime() - b.createdAt.getTime()
      if (time !== 0) return time
      if (a.id === b.id) return 0
      return a.id < b.id ? -1 : 1
    })
    return rows.slice(0, limit).map(copyCoachMessage)
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const kept: CoachMessageRecord[] = []
    let deleted = 0
    for (const message of this.store.coachMessages) {
      if (message.createdAt.getTime() < cutoff.getTime()) deleted += 1
      else kept.push(message)
    }
    this.store.coachMessages = kept
    return deleted
  }
}
