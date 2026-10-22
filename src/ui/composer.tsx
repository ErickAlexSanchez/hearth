'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { readErrorMessage } from '@/ui/api'
import { clearComposer, closeComposer, openComposer, setDraft, type RootState } from '@/ui/store'

export function Composer() {
  const dispatch = useDispatch()
  const composerOpen = useSelector((state: RootState) => state.ui.composerOpen)
  const draft = useSelector((state: RootState) => state.ui.draft)
  const [visibility, setVisibility] = useState<'public' | 'members'>('public')
  const [error, setError] = useState<string | null>(null)
  const client = useQueryClient()
  const publish = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: draft, visibility }),
      })
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Could not publish the post.'))
      }
    },
    onSuccess: async () => {
      dispatch(clearComposer())
      setVisibility('public')
      setError(null)
      await client.invalidateQueries({ queryKey: ['feed'] })
    },
    onError: (publishError: unknown) => {
      setError(publishError instanceof Error ? publishError.message : 'Could not publish the post.')
    },
  })

  return (
    <section className="composer" aria-label="Post composer">
      <button
        type="button"
        aria-expanded={composerOpen}
        onClick={() => {
          dispatch(composerOpen ? closeComposer() : openComposer())
        }}
      >
        {composerOpen ? 'Close composer' : 'Write a post'}
      </button>
      {composerOpen ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setError(null)
            publish.mutate()
          }}
        >
          <label htmlFor="post-body">Post</label>
          <textarea
            id="post-body"
            value={draft}
            onChange={(event) => {
              dispatch(setDraft(event.target.value))
            }}
          />
          <label htmlFor="post-visibility">Who can read this</label>
          <select
            id="post-visibility"
            value={visibility}
            onChange={(event) => {
              const value = event.target.value
              if (value === 'public' || value === 'members') setVisibility(value)
            }}
          >
            <option value="public">Everyone</option>
            <option value="members">Members</option>
          </select>
          {error ? <p role="alert">{error}</p> : null}
          <div className="row">
            <button type="submit" disabled={publish.isPending || draft.trim().length === 0}>
              {publish.isPending ? 'Publishing…' : 'Publish'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                dispatch(closeComposer())
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}
