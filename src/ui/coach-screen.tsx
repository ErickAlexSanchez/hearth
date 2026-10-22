'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { ApiError, fetchCoachThread, fetchSession, readCoachStream, readErrorMessage } from '@/ui/api'
import type { CoachMessageJson } from '@/contracts/schemas'
import { formatWhen } from '@/ui/format'
import { Shell } from '@/ui/shell'
import { EmptyState, ErrorState, LoadingState } from '@/ui/status'

type LiveTurn = {
  user: string
  coach: string
}

export function CoachScreen() {
  const isBrowser = typeof window !== 'undefined'
  const client = useQueryClient()
  const [question, setQuestion] = useState('')
  const [stream, setStream] = useState<LiveTurn | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    enabled: isBrowser,
  })
  const threadQuery = useQuery({
    queryKey: ['coach'],
    queryFn: fetchCoachThread,
    enabled: isBrowser && sessionQuery.data?.user != null,
  })
  const messages = threadQuery.data?.messages ?? []

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const text = question.trim()
    if (text.length === 0 || stream !== null) return
    setFormError(null)
    setQuestion('')
    setStream({ user: text, coach: '' })
    try {
      const response = await fetch('/api/coach/stream', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!response.ok) {
        setQuestion(text)
        setStream(null)
        setFormError(await readErrorMessage(response, 'The coach could not reply. Try again.'))
        return
      }
      await readCoachStream(response, (token) => {
        setStream((current) => (current ? { user: current.user, coach: current.coach + token } : current))
      })
      await client.invalidateQueries({ queryKey: ['coach'] })
      setStream(null)
    } catch (error) {
      setQuestion(text)
      setStream(null)
      setFormError(error instanceof Error ? error.message : 'The coach could not reply. Try again.')
    }
  }

  const showLiveUser =
    stream !== null && !messages.some((message) => message.role === 'user' && message.body === stream.user)
  const showLiveCoach =
    stream !== null &&
    stream.coach.length > 0 &&
    !messages.some((message) => message.role === 'coach' && message.body === stream.coach)

  return (
    <Shell>
      <h1>Coach</h1>
      <p className="notice" role="note">
        <strong>Note:</strong> Hearth Coach shares general habit ideas. This is not medical advice. It will not
        diagnose you or suggest a dose.
      </p>
      {body()}
      {sessionQuery.data?.user ? (
        <form className="coach-form" onSubmit={(event) => void onSubmit(event)}>
          <label htmlFor="habit-question">Habit question</label>
          <textarea
            id="habit-question"
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value)
            }}
          />
          {formError ? <p role="alert">{formError}</p> : null}
          <button type="submit" disabled={stream !== null || question.trim().length === 0}>
            {stream !== null ? 'Coach is replying…' : 'Ask the coach'}
          </button>
        </form>
      ) : null}
    </Shell>
  )

  function body() {
    if (!isBrowser || sessionQuery.isPending) return <LoadingState label="Loading Hearth…" />
    if (sessionQuery.isError) {
      return (
        <ErrorState
          message="Could not load your session."
          onRetry={() => {
            void sessionQuery.refetch()
          }}
        />
      )
    }
    if (!sessionQuery.data.user) {
      return (
        <section className="panel">
          <p>Sign in to ask about a habit you want to repeat.</p>
          <a className="button" href="/login">
            Sign in
          </a>
        </section>
      )
    }
    if (threadQuery.isPending) return <LoadingState label="Loading your habit notes…" />
    if (threadQuery.isError) {
      const unauthorized = threadQuery.error instanceof ApiError && threadQuery.error.name === 'UnauthorizedError'
      if (unauthorized) {
        return (
          <section className="panel">
            <p>Sign in to ask about a habit you want to repeat.</p>
            <a className="button" href="/login">
              Sign in
            </a>
          </section>
        )
      }
      return (
        <ErrorState
          message="Could not load your habit notes."
          onRetry={() => {
            void threadQuery.refetch()
          }}
        />
      )
    }
    return (
      <div className="stack" aria-live="polite">
        {messages.length === 0 && stream === null ? (
          <EmptyState message="No habit notes yet. Ask about one routine you want to repeat." />
        ) : null}
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {showLiveUser && stream ? <Message message={{ id: 'live-user', role: 'user', body: stream.user, createdAt: '' }} /> : null}
        {showLiveCoach && stream ? (
          <Message message={{ id: 'live-coach', role: 'coach', body: stream.coach, createdAt: '' }} />
        ) : null}
      </div>
    )
  }
}

function Message({ message }: { message: CoachMessageJson }) {
  return (
    <article className={message.role === 'coach' ? 'bubble coach' : 'bubble'}>
      <p className="author">{message.role === 'coach' ? 'Hearth Coach' : 'You'}</p>
      {message.createdAt ? (
        <p>
          <time dateTime={message.createdAt}>{formatWhen(message.createdAt)}</time>
        </p>
      ) : null}
      <p>{message.body}</p>
    </article>
  )
}
