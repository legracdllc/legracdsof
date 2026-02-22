import { useEffect, type ReactNode } from 'react'

// Keep body scroll lock stable even if multiple modals exist (mock UI).
let lockCount = 0
let savedOverflow: string | null = null
let savedPaddingRight: string | null = null

export function Modal({
  title,
  open,
  onClose,
  children,
  centered = false,
}: {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
  centered?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    const body = document.body

    // Defensive cleanup for stale modal state.
    if (!open) {
      if (lockCount === 0) {
        body.classList.remove('modalOpen')
        if (savedOverflow !== null) body.style.overflow = savedOverflow
        if (savedPaddingRight !== null) body.style.paddingRight = savedPaddingRight
        savedOverflow = null
        savedPaddingRight = null
      }
      return
    }

    const scrollbarW = window.innerWidth - document.documentElement.clientWidth

    if (lockCount === 0) {
      savedOverflow = body.style.overflow
      savedPaddingRight = body.style.paddingRight

      body.style.overflow = 'hidden'
      if (scrollbarW > 0) body.style.paddingRight = `${scrollbarW}px`
      body.classList.add('modalOpen')
    }

    lockCount += 1

    return () => {
      lockCount = Math.max(0, lockCount - 1)
      if (lockCount === 0) {
        body.classList.remove('modalOpen')
        body.style.overflow = savedOverflow ?? ''
        body.style.paddingRight = savedPaddingRight ?? ''
        savedOverflow = null
        savedPaddingRight = null
      }
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className={`modalBackdrop ${centered ? 'modalBackdropCentered' : ''}`.trim()}
      role="presentation"
      onMouseDown={(e) => {
        // Only close when the user clicks the backdrop, not when interacting inside the panel.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`modalPanel ${centered ? 'modalPanelCentered' : ''}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <div style={{ fontWeight: 900 }}>{title}</div>
          <button className="modalClose" type="button" onClick={onClose} aria-label="Close">
            x
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  )
}
