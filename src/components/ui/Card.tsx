import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`.trim()}>{children}</div>
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="cardHeader">
      <div className="row">
        <div>
          <h1 className="hTitle">{title}</h1>
          {subtitle ? <p className="hSub">{subtitle}</p> : null}
        </div>
        <div className="spacer" />
        {right ?? null}
      </div>
    </div>
  )
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="cardBody">{children}</div>
}

