export async function register(): Promise<void> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  const { getEnv } = await import('@/composition/env')
  getEnv()
}
