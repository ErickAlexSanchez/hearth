'use client'

import { useState, type FormEvent } from 'react'
import { readErrorMessage } from '@/ui/api'

export function AuthScreen({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const signingUp = mode === 'sign-up'

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const response = await fetch(signingUp ? '/api/auth/signup' : '/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(signingUp ? { email, password, displayName } : { email, password }),
      })
      if (!response.ok) {
        setError(await readErrorMessage(response, signingUp ? 'Could not create the account.' : 'Could not sign in.'))
        return
      }
      window.location.assign('/')
    } catch (submitError) {
      setError(submitError instanceof Error ? 'Could not reach Hearth.' : 'Could not reach Hearth.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main id="main" className="auth">
      <a className="brand" href="/">
        Hearth
      </a>
      <h1>{signingUp ? 'Create your account' : 'Sign in'}</h1>
      <p className="lede">
        {signingUp ? 'Start a free hearth and keep a few habits in view.' : 'Welcome back to your hearth.'}
      </p>
      <form onSubmit={(event) => void onSubmit(event)}>
        {signingUp ? (
          <>
            <label htmlFor="display-name">Display name</label>
            <input
              id="display-name"
              name="displayName"
              autoComplete="name"
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value)
              }}
              required
            />
          </>
        ) : null}
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
          }}
          required
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={signingUp ? 'new-password' : 'current-password'}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
          }}
          required
          minLength={8}
        />
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit" disabled={pending}>
          {pending ? (signingUp ? 'Creating account…' : 'Signing in…') : signingUp ? 'Create account' : 'Sign in'}
        </button>
      </form>
      {signingUp ? (
        <p>
          Already have an account? <a href="/login">Sign in</a>
        </p>
      ) : (
        <p>
          New here? <a href="/signup">Create an account</a>
        </p>
      )}
    </main>
  )
}
