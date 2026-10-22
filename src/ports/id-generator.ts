export interface IdGenerator {
  uuid(): string
  sessionToken(): string
}
