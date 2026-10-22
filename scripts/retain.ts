import './load-env'
import { retainCoachMessages } from '../src/application/coach/retain-coach'
import { createContainer } from '../src/composition/container'
import { getEnv } from '../src/composition/env'
import { writeSafeError } from './safe-error'

async function main(): Promise<void> {
  const env = getEnv()
  const container = createContainer(env)
  try {
    const result = await retainCoachMessages(container, {
      retentionDays: env.COACH_RETENTION_DAYS,
      requestId: container.ids.uuid(),
    })
    process.stdout.write(`${JSON.stringify({ deleted: result.deleted })}\n`)
  } finally {
    await container.close()
  }
}

main().catch((error: unknown) => {
  writeSafeError(error)
  process.exitCode = 1
})
