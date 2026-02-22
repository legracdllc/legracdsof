export type ScopeHistoryItem = {
  role: 'user' | 'assistant'
  content: string
}

export type ScopePayload = {
  prompt: string
  history?: ScopeHistoryItem[]
  tenantId?: string
}

export type MaterialPricePayload = {
  itemName: string
  sku?: string
  unit?: string
  location?: string
  tenantId?: string
}

export type AIGatewayConfig = {
  openaiApiKey: string
  openaiModel: string
  openaiPriceModel: string
  costSaver: boolean
  maxPromptChars: number
  maxHistoryItems: number
  maxScopeOutputTokens: number
  maxPriceOutputTokens: number
  queueConcurrency: number
  retryAttempts: number
  retryBaseDelayMs: number
  cacheTtlMs: number
  cacheMaxEntries: number
  maxRequestsPerTenantPerHour: number
}
