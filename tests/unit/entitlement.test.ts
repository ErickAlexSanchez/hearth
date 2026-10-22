import { DomainError } from '@/domain/errors'
import {
  assertCanPublish,
  assertCanReadPost,
  feedIncludesMembers,
} from '@/domain/membership/entitlement'

describe('entitlement', () => {
  it('refuses a members-only post to a free account', () => {
    expect(() => assertCanReadPost('free', 'members')).toThrow(DomainError)
    try {
      assertCanReadPost('free', 'members')
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError)
      if (error instanceof DomainError) expect(error.code).toBe('FORBIDDEN')
    }
  })

  it('allows a member to read a members-only post', () => {
    expect(() => assertCanReadPost('member', 'members')).not.toThrow()
    expect(() => assertCanReadPost('free', 'public')).not.toThrow()
  })

  it('refuses a members-only publish from a free account', () => {
    expect(() => assertCanPublish('free', 'members')).toThrow(DomainError)
    expect(() => assertCanPublish('member', 'members')).not.toThrow()
  })

  it('hides members-only posts from the free feed', () => {
    expect(feedIncludesMembers('free')).toBe(false)
    expect(feedIncludesMembers('member')).toBe(true)
  })
})
