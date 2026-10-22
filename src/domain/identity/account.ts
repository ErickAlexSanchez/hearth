import { DomainError } from '@/domain/errors'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function assertEmail(email: string): string {
  const normalized = email.trim().toLowerCase()
  if (!EMAIL.test(normalized) || normalized.length > 320) {
    throw new DomainError('VALIDATION', 'Enter a valid email address.')
  }
  return normalized
}

export function assertPassword(password: string): void {
  if (password.length < 8 || password.length > 200) {
    throw new DomainError('VALIDATION', 'Use a password between 8 and 200 characters.')
  }
}

export function assertDisplayName(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length < 1 || trimmed.length > 80) {
    throw new DomainError('VALIDATION', 'Enter a display name up to 80 characters.')
  }
  return trimmed
}
