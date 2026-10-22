import './load-env'
import { createContainer } from '../src/composition/container'
import { getEnv } from '../src/composition/env'
import { writeSafeError } from './safe-error'

const MIRA_ID = '11111111-1111-4111-8111-111111111111'
const JULES_ID = '22222222-2222-4222-8222-222222222222'
const PUBLIC_JULES = '33333333-3333-4333-8333-333333333331'
const PUBLIC_MIRA = '33333333-3333-4333-8333-333333333332'
const MEMBERS_POST = '33333333-3333-4333-8333-333333333333'
const COACH_USER = '44444444-4444-4444-8444-444444444441'
const COACH_REPLY = '44444444-4444-4444-8444-444444444442'

async function main(): Promise<void> {
  const container = createContainer(getEnv())
  try {
    const now = container.clock.now()
    const miraHash = await container.hasher.hash('hearth-demo-free')
    const julesHash = await container.hasher.hash('hearth-demo-member')
    for (const email of ['mira@hearth.example', 'jules@hearth.example']) {
      const existing = await container.identity.findUserByEmail(email)
      if (existing) await container.identity.deleteUser(existing.id)
    }
    await container.identity.insertUser({
      id: MIRA_ID,
      email: 'mira@hearth.example',
      displayName: 'Mira Sol',
      passwordHash: miraHash,
      createdAt: now,
    })
    await container.identity.insertUser({
      id: JULES_ID,
      email: 'jules@hearth.example',
      displayName: 'Jules Hart',
      passwordHash: julesHash,
      createdAt: now,
    })
    await container.memberships.insert({ userId: MIRA_ID, tier: 'free', updatedAt: now })
    await container.memberships.insert({ userId: JULES_ID, tier: 'member', updatedAt: now })
    await container.feedWrites.insert({
      id: PUBLIC_JULES,
      authorId: JULES_ID,
      body: 'I leave my shoes by the door at night so the morning walk starts without a decision.',
      visibility: 'public',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    })
    await container.feedWrites.insert({
      id: PUBLIC_MIRA,
      authorId: MIRA_ID,
      body: 'After lunch I walk to the end of the street and back before I open my laptop.',
      visibility: 'public',
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    })
    await container.feedWrites.insert({
      id: MEMBERS_POST,
      authorId: JULES_ID,
      body: 'Sunday review: we each name one habit we will repeat this week, and we drop the rest.',
      visibility: 'members',
      createdAt: new Date(now.getTime() - 60 * 60 * 1000),
    })
    await container.coach.insert({
      id: COACH_USER,
      userId: JULES_ID,
      role: 'user',
      body: 'How do I keep an evening wind-down?',
      createdAt: new Date(now.getTime() - 30 * 60 * 1000),
    })
    await container.coach.insert({
      id: COACH_REPLY,
      userId: JULES_ID,
      role: 'coach',
      body: 'Dim the lights, set your phone in another room, and read a few pages at the same time each night.',
      createdAt: new Date(now.getTime() - 29 * 60 * 1000),
    })
  } finally {
    await container.close()
  }
}

main().catch((error: unknown) => {
  writeSafeError(error)
  process.exitCode = 1
})
