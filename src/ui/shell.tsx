'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { fetchSession } from '@/ui/api'
import type { PublicUserJson } from '@/contracts/schemas'
import { HeaderControls } from '@/ui/header-controls'
import { useCopy } from '@/ui/preferences'

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const copy = useCopy()
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    enabled: typeof window !== 'undefined',
  })
  return (
    <>
      <header className="site-header">
        <div className="header-identity">
          <a className="brand" href="/">
            <Flame />
            <span>Hearth</span>
          </a>
          <nav aria-label={copy.primaryNav}>
            <a href="/" aria-current={pathname === '/' ? 'page' : undefined}>
              {copy.feed}
            </a>
            <a href="/coach" aria-current={pathname === '/coach' ? 'page' : undefined}>
              {copy.coach}
            </a>
          </nav>
        </div>
        <div className="header-tools">
          <HeaderControls />
          <AccountMenu user={sessionQuery.data?.user ?? null} pending={sessionQuery.isPending} />
        </div>
      </header>
      <main id="main">{children}</main>
    </>
  )
}

function AccountMenu({ user, pending }: { user: PublicUserJson | null; pending: boolean }) {
  const client = useQueryClient()
  const copy = useCopy()
  const [error, setError] = useState<string | null>(null)
  if (pending) return <p className="account-pending">{copy.loadingAccount}</p>
  if (!user) {
    return (
      <a className="text-link" href="/login">
        {copy.signIn}
      </a>
    )
  }
  return (
    <div className="account">
      <p>{user.displayName}</p>
      <p className={user.tier === 'member' ? 'tier member' : 'tier'}>{user.tier === 'member' ? copy.member : copy.free}</p>
      <button
        type="button"
        onClick={() => {
          void signOut(client, setError, copy.signOutError)
        }}
      >
        {copy.signOut}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  )
}

async function signOut(
  client: ReturnType<typeof useQueryClient>,
  setError: (value: string | null) => void,
  signOutError: string,
): Promise<void> {
  setError(null)
  const response = await fetch('/api/auth/logout', { method: 'POST' })
  if (!response.ok) {
    setError(signOutError)
    return
  }
  await client.invalidateQueries({ queryKey: ['session'] })
  window.location.assign('/login')
}

function Flame() {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 3c1 5 7 7 7 14a7 7 0 1 1-14 0c0-3 2-5 3-7 1 3 2 3 4 2-1-4 0-7 0-9z"
      />
    </svg>
  )
}
