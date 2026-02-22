import type { ReactNode } from 'react'

export function Badge({
  tone = 'navy',
  children,
  className,
}: {
  tone?: 'navy' | 'gold'
  children: ReactNode
  className?: string
}) {
  const cls = tone === 'gold' ? 'badgeGold' : 'badgeNavy'
  return <span className={`badge ${cls} ${className ?? ''}`.trim()}>{children}</span>
}
