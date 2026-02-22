import type { ButtonHTMLAttributes } from 'react'

type Variant = 'default' | 'primary' | 'danger'

export function Button({
  variant = 'default',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const v =
    variant === 'primary' ? 'btnPrimary' : variant === 'danger' ? 'btnDanger' : ''
  return <button className={`btn ${v} ${className}`.trim()} {...props} />
}

