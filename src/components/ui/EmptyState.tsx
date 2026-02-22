import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div
      className="card"
      style={{
        padding: 18,
        borderStyle: 'dashed',
        background: 'rgba(255,255,255,0.75)',
      }}
    >
      <div style={{ fontWeight: 900, letterSpacing: '-0.01em' }}>{title}</div>
      {description ? <div className="help" style={{ marginTop: 6 }}>{description}</div> : null}
      {action ? <div className="row" style={{ marginTop: 12 }}>{action}</div> : null}
    </div>
  )
}

