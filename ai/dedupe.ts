export class InflightDedupe {
  private inflight = new Map<string, Promise<unknown>>()

  async resolve<T>(key: string, producer: () => Promise<T>): Promise<T> {
    const hit = this.inflight.get(key)
    if (hit) return (await hit) as T
    const p = producer().finally(() => this.inflight.delete(key))
    this.inflight.set(key, p as Promise<unknown>)
    return await p
  }
}
