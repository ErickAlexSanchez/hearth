'use client'

import { type FormEvent, useState } from 'react'
import { readErrorMessage } from '@/ui/api'
import { HeaderControls } from '@/ui/header-controls'
import { useCopy } from '@/ui/preferences'

export function AuthScreen({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const copy = useCopy()
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
        setError(await readErrorMessage(response, signingUp ? copy.signUpFailed : copy.signInFailed))
        return
      }
      window.location.assign('/')
    } catch {
      setError(copy.reachFailed)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="/">
          Hearth
        </a>
        <div className="header-tools">
          <HeaderControls />
        </div>
      </header>
      <main id="main" className="auth">
        <h1>{signingUp ? copy.signUpTitle : copy.signInTitle}</h1>
        <p className="lede">{signingUp ? copy.signUpLede : copy.signInLede}</p>
        <form onSubmit={(event) => void onSubmit(event)}>
          {signingUp ? (
            <>
              <label htmlFor="display-name">{copy.displayNameLabel}</label>
              <input
                id="display-name"
                name="displayName"
                autoComplete="name"
                maxLength={80}
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value)
                }}
                required
              />
            </>
          ) : null}
          <label htmlFor="email">{copy.emailLabel}</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={320}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
            }}
            required
          />
          <label htmlFor="password">{copy.passwordLabel}</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={signingUp ? 'new-password' : 'current-password'}
            minLength={8}
            maxLength={200}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
            }}
            required
          />
          {error ? <p role="alert">{error}</p> : null}
          <button type="submit" disabled={pending}>
            {pending
              ? signingUp
                ? copy.creatingAccount
                : copy.signingIn
              : signingUp
                ? copy.createAccountSubmit
                : copy.signIn}
          </button>
        </form>
        {signingUp ? (
          <p>
            {copy.alreadyHaveAccount} <a href="/login">{copy.signIn}</a>
          </p>
        ) : (
          <p>
            {copy.newHere} <a href="/signup">{copy.createAccount}</a>
          </p>
        )}
      </main>
    </>
  )
}
