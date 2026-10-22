import { closeContainer, getContainer } from '@/composition/container'

beforeAll(async () => {
  try {
    await getContainer().migrate()
  } catch (error) {
    const message = error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgres://redacted') : 'database setup failed'
    throw new Error(`Postgres is not ready. Start it with docker compose up -d. ${message}`)
  }
})

afterAll(async () => {
  await closeContainer()
})
