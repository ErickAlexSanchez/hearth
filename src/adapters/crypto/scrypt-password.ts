import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { PasswordHasher } from '@/ports/password-hasher'

const scryptAsync = promisify(scrypt)
const FALLBACK_SALT = Buffer.from('hearth-fallback-salt')

type ParsedHash = {
  salt: Buffer
  expected: Buffer
}

function parseHash(stored: string): ParsedHash | null {
  const parts = stored.split('$')
  const scheme = parts[0]
  const saltPart = parts[1]
  const hashPart = parts[2]
  if (parts.length !== 3 || scheme !== 'scrypt' || !saltPart || !hashPart) return null
  return {
    salt: Buffer.from(saltPart, 'base64url'),
    expected: Buffer.from(hashPart, 'base64url'),
  }
}

async function derive(password: string, salt: Buffer, length: number): Promise<Buffer | null> {
  const derived = await scryptAsync(password, salt, length)
  if (!Buffer.isBuffer(derived)) return null
  return derived
}

export function createScryptPasswordHasher(): PasswordHasher {
  return {
    async hash(password: string): Promise<string> {
      const salt = randomBytes(16)
      const derived = await derive(password, salt, 32)
      if (!derived) {
        throw new Error('Password hashing failed.')
      }
      return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`
    },
    async verify(password: string, passwordHash: string): Promise<boolean> {
      const parsed = parseHash(passwordHash)
      const salt = parsed?.salt ?? FALLBACK_SALT
      const expected = parsed?.expected ?? Buffer.alloc(32)
      const derived = await derive(password, salt, expected.length)
      if (!parsed || !derived || derived.length !== expected.length) return false
      return timingSafeEqual(derived, expected)
    },
  }
}
