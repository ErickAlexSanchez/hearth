export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'edge') return
  const { registerNode } = await import('@/instrumentation-node')
  await registerNode()
}
