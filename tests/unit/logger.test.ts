import { createJsonLogger } from '@/adapters/logging/json-logger'

describe('json logger', () => {
  it('keeps the request id and drops coach content, tokens, and database urls', () => {
    const lines: string[] = []
    const logger = createJsonLogger((line) => {
      lines.push(line)
    })
    logger.info('coach.turn', {
      requestId: 'req-1',
      body: 'private habit note',
      text: 'another note',
      token: 'session-token',
      password: 'secret-password',
      deleted: 2,
      path: 'postgres://hearth:hearth@localhost:5434/hearth',
    })
    const line = lines[0]
    expect(line).toBeDefined()
    const parsed: unknown = JSON.parse(line ?? '')
    expect(parsed).toMatchObject({
      level: 'info',
      event: 'coach.turn',
      requestId: 'req-1',
      deleted: 2,
    })
    expect(line).not.toContain('private habit note')
    expect(line).not.toContain('session-token')
    expect(line).not.toContain('secret-password')
    expect(line).not.toContain('postgres://')
  })
})
