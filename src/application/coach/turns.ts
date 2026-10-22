import { assertHabitQuestion } from '@/domain/coach/retention'
import { DomainError } from '@/domain/errors'
import type { Clock } from '@/ports/clock'
import type { CoachRepository } from '@/ports/coach-repository'
import type { IdGenerator } from '@/ports/id-generator'
import type { MembershipRepository } from '@/ports/membership-repository'

export type CoachMessageView = {
  id: string
  role: 'user' | 'coach'
  body: string
  createdAt: string
}

export async function readCoachThread(
  deps: { memberships: MembershipRepository; coach: CoachRepository },
  input: { userId: string },
): Promise<{ messages: CoachMessageView[] }> {
  const membership = await deps.memberships.findByUserId(input.userId)
  if (!membership) {
    throw new DomainError('UNAUTHORIZED', 'Sign in required.')
  }
  const rows = await deps.coach.listByUser(input.userId, 50)
  return {
    messages: rows.map((row) => ({
      id: row.id,
      role: row.role,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
    })),
  }
}

export async function beginCoachTurn(
  deps: {
    memberships: MembershipRepository
    coach: CoachRepository
    ids: IdGenerator
    clock: Clock
  },
  input: { userId: string; text: string },
): Promise<{ text: string }> {
  const text = assertHabitQuestion(input.text)
  const membership = await deps.memberships.findByUserId(input.userId)
  if (!membership) {
    throw new DomainError('UNAUTHORIZED', 'Sign in required.')
  }
  await deps.coach.insert({
    id: deps.ids.uuid(),
    userId: input.userId,
    role: 'user',
    body: text,
    createdAt: deps.clock.now(),
  })
  return { text }
}

export async function finishCoachTurn(
  deps: { coach: CoachRepository; ids: IdGenerator; clock: Clock },
  input: { userId: string; text: string },
): Promise<void> {
  const text = input.text.trim()
  if (text.length < 1 || text.length > 4000) {
    throw new DomainError('VALIDATION', 'The coach reply could not be saved.')
  }
  await deps.coach.insert({
    id: deps.ids.uuid(),
    userId: input.userId,
    role: 'coach',
    body: text,
    createdAt: deps.clock.now(),
  })
}
