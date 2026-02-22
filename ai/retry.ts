export async function retry<T>(fn: () => Promise<T>, attempts: number, baseDelayMs: number): Promise<T> {
  let lastError: unknown = null
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (i >= attempts - 1) break
      const jitter = Math.floor(Math.random() * 75)
      const delay = baseDelayMs * Math.pow(2, i) + jitter
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Retry failed')
}
