export class TaskQueue {
  private running = 0
  private waiting: Array<() => void> = []
  private readonly concurrency: number
  constructor(concurrency: number) {
    this.concurrency = Math.max(1, concurrency)
  }
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= this.concurrency) {
      await new Promise<void>((resolve) => this.waiting.push(resolve))
    }
    this.running += 1
    try {
      return await fn()
    } finally {
      this.running = Math.max(0, this.running - 1)
      const next = this.waiting.shift()
      if (next) next()
    }
  }
}
