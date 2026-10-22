import type { SessionRecord, UserRecord } from '@/ports/identity-repository'
import type { MembershipRecord } from '@/ports/membership-repository'

export interface AccountWriter {
  createAccount(input: {
    user: UserRecord
    membership: MembershipRecord
    session: SessionRecord
  }): Promise<void>
}
