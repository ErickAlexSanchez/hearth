'use client'

import { useCopy } from '@/ui/preferences'

export function LoadingState({ label }: { label: string }) {
  return (
    <p className="status" role="status" aria-live="polite" aria-busy="true">
      {label}
    </p>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const copy = useCopy()
  return (
    <div className="status error" role="alert">
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        {copy.tryAgain}
      </button>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <p className="status">{message}</p>
}
