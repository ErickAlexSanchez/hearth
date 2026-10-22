import { planHabitReply } from '@/domain/coach/habits'
import type { CoachResponder } from '@/ports/coach-responder'

export function createFakeCoachResponder(): CoachResponder {
  return {
    async *reply(input: { userText: string }): AsyncIterable<string> {
      const text = planHabitReply(input.userText)
      const parts = text.split(/(\s+)/)
      for (const part of parts) {
        if (part.length > 0) yield part
      }
    },
  }
}
