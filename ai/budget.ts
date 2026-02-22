type UsageBucket = {
  requests: number
  estTokensIn: number
  estTokensOut: number
}

export class InMemoryBudget {
  private readonly maxRequestsPerTenantPerHour: number
  private buckets = new Map<string, UsageBucket>()

  constructor(maxRequestsPerTenantPerHour: number) {
    this.maxRequestsPerTenantPerHour = Math.max(1, maxRequestsPerTenantPerHour)
  }

  private bucketKey(tenantId: string) {
    const now = new Date()
    const hour = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}-${now.getUTCHours()}`
    return `${tenantId}:${hour}`
  }

  canConsume(tenantId: string) {
    const key = this.bucketKey(tenantId)
    const b = this.buckets.get(key)
    if (!b) return true
    return b.requests < this.maxRequestsPerTenantPerHour
  }

  consume(tenantId: string, estTokensIn: number, estTokensOut: number) {
    const key = this.bucketKey(tenantId)
    const cur = this.buckets.get(key) ?? { requests: 0, estTokensIn: 0, estTokensOut: 0 }
    const next: UsageBucket = {
      requests: cur.requests + 1,
      estTokensIn: cur.estTokensIn + Math.max(0, Math.trunc(estTokensIn)),
      estTokensOut: cur.estTokensOut + Math.max(0, Math.trunc(estTokensOut)),
    }
    this.buckets.set(key, next)
  }
}
