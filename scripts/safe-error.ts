export function writeSafeError(error: unknown): void {
  const message = error instanceof Error ? error.message : 'The command failed.'
  const redacted = message.replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgres://redacted')
  process.stderr.write(`${redacted}\n`)
}
