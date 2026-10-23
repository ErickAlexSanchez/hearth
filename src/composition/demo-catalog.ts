import { formatScryptHash } from '@/adapters/crypto/scrypt-password'
import { insertCoachMessage, insertMembership, insertPost, insertUser, type MemoryStore } from '@/adapters/memory/store'

export const DEMO_FREE_EMAIL = 'mira@hearth.example'
export const DEMO_FREE_PASSWORD = 'hearth-demo-free'
export const DEMO_MEMBER_EMAIL = 'jules@hearth.example'
export const DEMO_MEMBER_PASSWORD = 'hearth-demo-member'

export const DEMO_FREE_ID = '11111111-1111-4111-8111-111111111111'
export const DEMO_MEMBER_ID = '22222222-2222-4222-8222-222222222222'
export const DEMO_PUBLIC_MEMBER_POST_ID = '33333333-3333-4333-8333-333333333331'
export const DEMO_PUBLIC_FREE_POST_ID = '33333333-3333-4333-8333-333333333332'
export const DEMO_MEMBERS_POST_ID = '33333333-3333-4333-8333-333333333333'

export const DEMO_PUBLIC_POST_BODY =
  'I leave my shoes by the door at night so the morning walk starts without a decision.'
export const DEMO_MEMBERS_POST_BODY =
  'Sunday review: we each name one habit we will repeat this week, and we drop the rest.'

const MIRA_SALT = Buffer.from('hearth-mira-salt')
const JULES_SALT = Buffer.from('hearth-jules-sal')

let passwordHashes: { free: string; member: string } | undefined

function hashes(): { free: string; member: string } {
  if (!passwordHashes) {
    passwordHashes = {
      free: formatScryptHash(DEMO_FREE_PASSWORD, MIRA_SALT),
      member: formatScryptHash(DEMO_MEMBER_PASSWORD, JULES_SALT),
    }
  }
  return passwordHashes
}

export function seedDemoCatalog(store: MemoryStore, now: Date): void {
  const { free, member } = hashes()
  insertUser(store, {
    id: DEMO_FREE_ID,
    email: DEMO_FREE_EMAIL,
    displayName: 'Mira Sol',
    passwordHash: free,
    createdAt: now,
  })
  insertUser(store, {
    id: DEMO_MEMBER_ID,
    email: DEMO_MEMBER_EMAIL,
    displayName: 'Jules Hart',
    passwordHash: member,
    createdAt: now,
  })
  insertMembership(store, { userId: DEMO_FREE_ID, tier: 'free', updatedAt: now })
  insertMembership(store, { userId: DEMO_MEMBER_ID, tier: 'member', updatedAt: now })
  insertPost(store, {
    id: DEMO_PUBLIC_MEMBER_POST_ID,
    authorId: DEMO_MEMBER_ID,
    body: DEMO_PUBLIC_POST_BODY,
    visibility: 'public',
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
  })
  insertPost(store, {
    id: DEMO_PUBLIC_FREE_POST_ID,
    authorId: DEMO_FREE_ID,
    body: 'After lunch I walk to the end of the street and back before I open my laptop.',
    visibility: 'public',
    createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
  })
  insertPost(store, {
    id: DEMO_MEMBERS_POST_ID,
    authorId: DEMO_MEMBER_ID,
    body: DEMO_MEMBERS_POST_BODY,
    visibility: 'members',
    createdAt: new Date(now.getTime() - 60 * 60 * 1000),
  })
  insertCoachMessage(store, {
    id: '44444444-4444-4444-8444-444444444441',
    userId: DEMO_MEMBER_ID,
    role: 'user',
    body: 'How do I keep an evening wind-down?',
    createdAt: new Date(now.getTime() - 30 * 60 * 1000),
  })
  insertCoachMessage(store, {
    id: '44444444-4444-4444-8444-444444444442',
    userId: DEMO_MEMBER_ID,
    role: 'coach',
    body: 'Dim the lights, set your phone in another room, and read a few pages at the same time each night.',
    createdAt: new Date(now.getTime() - 29 * 60 * 1000),
  })
}
