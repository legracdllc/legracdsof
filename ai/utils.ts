import { createHash } from 'node:crypto'

export function sendJson(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

export async function readJsonBody(req: any): Promise<any> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

export function extractResponseText(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim()
  const blocks = Array.isArray(payload?.output) ? payload.output : []
  for (const b of blocks) {
    const content = Array.isArray(b?.content) ? b.content : []
    for (const c of content) {
      if (typeof c?.text === 'string' && c.text.trim()) return c.text.trim()
    }
  }
  return ''
}

export function toInt(raw: string | undefined, fallback: number) {
  const v = Number(raw)
  return Number.isFinite(v) ? Math.max(1, Math.trunc(v)) : fallback
}

export function clampText(input: string, maxChars: number) {
  const s = String(input ?? '').trim()
  if (s.length <= maxChars) return s
  return `${s.slice(0, Math.max(0, maxChars - 16))} ...[truncated]`
}

export function sha1Key(value: unknown) {
  return createHash('sha1').update(JSON.stringify(value)).digest('hex')
}
