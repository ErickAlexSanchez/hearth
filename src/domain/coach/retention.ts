import { DomainError } from '@/domain/errors'

const DAY_MS = 24 * 60 * 60 * 1000

export function retentionCutoff(now: Date, retentionDays: number): Date {
  if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
    throw new DomainError('VALIDATION', 'Retention window is invalid.')
  }
  return new Date(now.getTime() - retentionDays * DAY_MS)
}

export function assertHabitQuestion(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length < 1 || trimmed.length > 2000) {
    throw new DomainError('VALIDATION', 'Ask about a habit in 1 to 2000 characters.')
  }
  return trimmed
}
