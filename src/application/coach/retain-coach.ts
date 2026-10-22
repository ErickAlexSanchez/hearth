import { retentionCutoff } from '@/domain/coach/retention'
import type { Clock } from '@/ports/clock'
import type { CoachRepository } from '@/ports/coach-repository'
import type { Logger } from '@/ports/logger'

export async function retainCoachMessages(
  deps: {
    coach: CoachRepository
    clock: Clock
    logger: Logger
  },
  input: { retentionDays: number; requestId: string },
): Promise<{ deleted: number }> {
  const cutoff = retentionCutoff(deps.clock.now(), input.retentionDays)
  const deleted = await deps.coach.deleteOlderThan(cutoff)
  deps.logger.info('coach.retention.completed', {
    requestId: input.requestId,
    deleted,
    retentionDays: input.retentionDays,
  })
  return { deleted }
}
