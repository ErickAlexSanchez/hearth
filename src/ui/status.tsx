export function LoadingState({ label }: { label: string }) {
  return (
    <p className="status" role="status" aria-live="polite" aria-busy="true">
      {label}
    </p>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="status error" role="alert">
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <p className="status">{message}</p>
}
