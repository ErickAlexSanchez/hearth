import './load-env'
import { createContainer } from '../src/composition/container'
import { getEnv } from '../src/composition/env'
import { writeSafeError } from './safe-error'

async function main(): Promise<void> {
  const container = createContainer(getEnv())
  try {
    await container.migrate()
  } finally {
    await container.close()
  }
}

main().catch((error: unknown) => {
  writeSafeError(error)
  process.exitCode = 1
})
