import { useRef } from 'react'
import { Button } from './Button'

export type UploadMetaFile = {
  id: string
  name: string
  mime: string
  size: number
  // For mock previews only (object URLs won't persist across reloads).
  previewUrl?: string
}

export function FileUploadFilesMock({
  accept,
  label,
  help,
  multiple = true,
  withPreviewUrl = false,
  onAdd,
}: {
  accept: string
  label: string
  help?: string
  multiple?: boolean
  withPreviewUrl?: boolean
  onAdd: (files: UploadMetaFile[]) => void
}) {
  const ref = useRef<HTMLInputElement | null>(null)

  return (
    <div className="row">
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={(e) => {
          const list = Array.from(e.target.files ?? [])
          const mapped = list.map((f) => ({
            id: crypto.randomUUID(),
            name: f.name,
            mime: f.type ?? '',
            size: f.size ?? 0,
            previewUrl: withPreviewUrl ? URL.createObjectURL(f) : undefined,
          }))
          onAdd(mapped)
          if (ref.current) ref.current.value = ''
        }}
      />
      <Button type="button" onClick={() => ref.current?.click()}>
        {label}
      </Button>
      <span className="help">{help ?? 'Upload. TODO: real backend storage.'}</span>
    </div>
  )
}

