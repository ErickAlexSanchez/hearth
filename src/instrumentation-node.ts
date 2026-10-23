export async function registerNode(): Promise<void> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  const write = process.env.DATABASE_URL?.trim() ?? ''
  const read = process.env.DATABASE_READ_URL?.trim() ?? ''
  if (write.length === 0 && read.length === 0) return
  const { parseEnv } = await import('@/composition/env')
  parseEnv(process.env)
}
