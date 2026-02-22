import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { AIGateway } from './ai/gateway'
import { readJsonBody, sendJson, toInt } from './ai/utils'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const costSaver = (env.AI_COST_SAVER ?? 'false').toLowerCase() === 'true'

  const maxPromptChars = toInt(env.AI_MAX_PROMPT_CHARS, 1400)
  const maxHistoryItems = toInt(env.AI_MAX_HISTORY_ITEMS, 4)
  const maxScopeOutputTokens = toInt(env.AI_MAX_OUTPUT_TOKENS_SCOPE, 650)
  const maxPriceOutputTokens = toInt(env.AI_MAX_OUTPUT_TOKENS_PRICE, 900)
  const queueConcurrency = toInt(env.AI_QUEUE_CONCURRENCY, 2)
  const retryAttempts = toInt(env.AI_RETRY_ATTEMPTS, 3)
  const retryBaseDelayMs = toInt(env.AI_RETRY_BASE_DELAY_MS, 350)
  const cacheTtlMs = toInt(env.AI_CACHE_TTL_MS, 8 * 60 * 1000)
  const cacheMaxEntries = toInt(env.AI_CACHE_MAX_ENTRIES, 300)

  const gateway = new AIGateway({
    openaiApiKey: (env.OPENAI_API_KEY ?? '').trim(),
    openaiModel: (env.OPENAI_MODEL ?? 'gpt-4o-mini').trim(),
    openaiPriceModel: (env.OPENAI_PRICE_MODEL ?? env.OPENAI_MODEL ?? 'gpt-4.1-mini').trim(),
    costSaver,
    maxPromptChars: costSaver ? Math.min(maxPromptChars, 900) : maxPromptChars,
    maxHistoryItems: costSaver ? Math.min(maxHistoryItems, 2) : maxHistoryItems,
    maxScopeOutputTokens: costSaver ? Math.min(maxScopeOutputTokens, 360) : maxScopeOutputTokens,
    maxPriceOutputTokens: costSaver ? Math.min(maxPriceOutputTokens, 520) : maxPriceOutputTokens,
    queueConcurrency: costSaver ? Math.min(queueConcurrency, 1) : queueConcurrency,
    retryAttempts: costSaver ? Math.min(retryAttempts, 2) : retryAttempts,
    retryBaseDelayMs: costSaver ? Math.max(retryBaseDelayMs, 450) : retryBaseDelayMs,
    cacheTtlMs: costSaver ? Math.max(cacheTtlMs, 25 * 60 * 1000) : cacheTtlMs,
    cacheMaxEntries: costSaver ? Math.max(cacheMaxEntries, 500) : cacheMaxEntries,
    maxRequestsPerTenantPerHour: toInt(env.AI_BUDGET_MAX_REQUESTS_PER_TENANT_PER_HOUR, 200),
  })

  return {
    plugins: [
      react(),
      {
        name: 'mock-ai-endpoints',
        configureServer(server) {
          server.middlewares.use('/api/ai/scope', async (req, res) => {
            if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
            try {
              const body = await readJsonBody(req)
              const tenantId = String(req.headers['x-tenant-id'] ?? body?.tenantId ?? '').trim() || 'default'
              const out = await gateway.runScope({
                prompt: String(body?.prompt ?? ''),
                history: Array.isArray(body?.history) ? body.history : [],
                tenantId,
              })
              return sendJson(res, 200, out)
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Unexpected error'
              const status = /missing in server env|required|budget exceeded/i.test(message) ? 400 : 500
              return sendJson(res, status, { error: message })
            }
          })

          server.middlewares.use('/api/ai/material-prices', async (req, res) => {
            if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
            try {
              const body = await readJsonBody(req)
              const tenantId = String(req.headers['x-tenant-id'] ?? body?.tenantId ?? '').trim() || 'default'
              const out = await gateway.runMaterialPrices({
                itemName: String(body?.itemName ?? ''),
                sku: String(body?.sku ?? ''),
                unit: String(body?.unit ?? 'ea'),
                location: String(body?.location ?? ''),
                tenantId,
              })
              return sendJson(res, 200, out)
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Unexpected error'
              const status = /missing in server env|required|budget exceeded/i.test(message) ? 400 : 500
              return sendJson(res, status, { error: message })
            }
          })
        },
      },
    ],
    server: {
      // Allow access from other devices on the same LAN (e.g., phone).
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      // Keep dev access flexible for LAN + Cloudflare tunnel hostnames.
      allowedHosts: true,
    },
  }
})
