export type CacheEntry<T> = {
  value: T
  expiresAt: number
}

export class SimpleCache<T> {
  private readonly ttlMs: number
  private readonly maxEntries: number
  private map = new Map<string, CacheEntry<T>>()
  constructor(ttlMs: number, maxEntries: number) {
    this.ttlMs = ttlMs
    this.maxEntries = maxEntries
  }
  get(key: string): T | null {
    const hit = this.map.get(key)
    if (!hit) return null
    if (Date.now() > hit.expiresAt) {
      this.map.delete(key)
      return null
    }
    return hit.value
  }
  set(key: string, value: T) {
    if (this.map.size >= this.maxEntries) {
      const oldest = this.map.keys().next().value
      if (oldest) this.map.delete(oldest)
    }
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }
}
