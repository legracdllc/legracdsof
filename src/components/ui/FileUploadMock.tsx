import { useRef } from 'react'
import { Button } from './Button'

export type UploadMockFile = { id: string; name: string; previewUrl: string }

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') resolve(result)
      else reject(new Error('Unable to read file preview.'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file preview.'))
    reader.readAsDataURL(file)
  })
}

export function FileUploadMock({
  onAdd,
}: {
  onAdd: (files: UploadMockFile[]) => void
}) {
  const ref = useRef<HTMLInputElement | null>(null)

  return (
    <div className="row">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={async (e) => {
          const list = Array.from(e.target.files ?? [])
          const previews = await Promise.all(list.map((f) => fileToDataUrl(f)))
          const mapped = list.map((f, idx) => ({
            id: crypto.randomUUID(),
            name: f.name,
            previewUrl: previews[idx],
          }))
          onAdd(mapped)
          if (ref.current) ref.current.value = ''
        }}
      />
      <Button type="button" onClick={() => ref.current?.click()}>
        Upload media 
      </Button>
      <span className="help">Stores image previews in-app so they stay visible across portal views.</span>
    </div>
  )
}
