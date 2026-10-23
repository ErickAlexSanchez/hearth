'use client'

import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { DEMO_MEMBERS_POST_PATH, DEMO_MEMBERS_POST_URL, type Messages } from '@/ui/messages'

const TABBABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function tabbableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE)).filter((element) => {
    if (element.hasAttribute('disabled')) return false
    if (element.getAttribute('aria-hidden') === 'true') return false
    return element.tabIndex >= 0
  })
}

function trapTab(event: KeyboardEvent, dialog: HTMLElement): void {
  if (event.key !== 'Tab') return
  const items = tabbableElements(dialog)
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) {
    event.preventDefault()
    dialog.focus()
    return
  }
  const active = document.activeElement
  if (event.shiftKey) {
    if (active === first || active === dialog || !dialog.contains(active)) {
      event.preventDefault()
      last.focus()
    }
    return
  }
  if (active === last || !dialog.contains(active)) {
    event.preventDefault()
    first.focus()
  }
}

export function DemoDialog({
  copy,
  onClose,
  dialogId,
  titleId,
}: {
  copy: Messages
  onClose: () => void
  dialogId: string
  titleId: string
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog?.focus()

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (dialog) trapTab(event, dialog)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (previous && document.contains(previous)) previous.focus()
    }
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="dialog"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <h2 id={titleId}>{copy.aboutName}</h2>
        <section>
          <h3>{copy.whatTitle}</h3>
          <p>{copy.whatBody}</p>
        </section>
        <section>
          <h3>{copy.caseTitle}</h3>
          <p>{copy.caseBody}</p>
        </section>
        <section>
          <h3>{copy.architectureTitle}</h3>
          <p>{copy.architectureBody}</p>
        </section>
        <section>
          <h3>{copy.demoTitle}</h3>
          <p>{copy.demoIntro}</p>
          <ul>
            <li>{copy.julesAccount}</li>
            <li>{copy.miraAccount}</li>
          </ul>
          <p>
            {copy.membersLead}{' '}
            <a className="dialog-url" href={DEMO_MEMBERS_POST_PATH}>
              {DEMO_MEMBERS_POST_URL}
            </a>{' '}
            {copy.membersResult}
          </p>
          <p>{copy.tryIt}</p>
        </section>
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={onClose}>
            {copy.close}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
