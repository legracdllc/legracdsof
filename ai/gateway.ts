import { InMemoryBudget } from './budget'
import { SimpleCache } from './cache'
import { InflightDedupe } from './dedupe'
import { TaskQueue } from './queue'
import { retry } from './retry'
import { clampText, extractResponseText, sha1Key } from './utils'
import type { AIGatewayConfig, MaterialPricePayload, ScopePayload, ScopeHistoryItem } from './types'

export class AIGateway {
  private readonly cfg: AIGatewayConfig
  private readonly queue: TaskQueue
  private readonly scopeCache: SimpleCache<any>
  private readonly priceCache: SimpleCache<any>
  private readonly dedupe: InflightDedupe
  private readonly budget: InMemoryBudget

  constructor(cfg: AIGatewayConfig) {
    this.cfg = cfg
    this.queue = new TaskQueue(cfg.queueConcurrency)
    this.scopeCache = new SimpleCache<any>(cfg.cacheTtlMs, cfg.cacheMaxEntries)
    this.priceCache = new SimpleCache<any>(cfg.cacheTtlMs, cfg.cacheMaxEntries)
    this.dedupe = new InflightDedupe()
    this.budget = new InMemoryBudget(cfg.maxRequestsPerTenantPerHour)
  }

  private tenantOrDefault(raw?: string) {
    const t = String(raw ?? '').trim()
    return t || 'default'
  }

  private canSpend(tenantId: string) {
    if (!this.budget.canConsume(tenantId)) {
      throw new Error('AI budget exceeded for tenant (hourly limit)')
    }
  }

  private recordSpend(tenantId: string, promptChars: number, maxOutTokens: number) {
    const estTokensIn = Math.ceil(promptChars / 4)
    this.budget.consume(tenantId, estTokensIn, maxOutTokens)
  }

  private async callOpenAIJson(body: unknown) {
    return retry(async () => {
      const resp = await this.queue.run(() =>
        fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.cfg.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }),
      )
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`OpenAI error: ${text}`)
      }
      return (await resp.json()) as any
    }, this.cfg.retryAttempts, this.cfg.retryBaseDelayMs)
  }

  private async callOpenAIResponse(body: unknown) {
    return retry(async () => {
      const resp = await this.queue.run(() =>
        fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.cfg.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }),
      )
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`OpenAI error: ${text}`)
      }
      return (await resp.json()) as any
    }, this.cfg.retryAttempts, this.cfg.retryBaseDelayMs)
  }

  async runScope(payload: ScopePayload) {
    const tenantId = this.tenantOrDefault(payload.tenantId)
    const prompt = clampText(String(payload.prompt ?? ''), this.cfg.maxPromptChars)
    if (!prompt) throw new Error('Prompt is required')

    const rawHistory = Array.isArray(payload.history) ? payload.history : []
    const historyLimit = this.cfg.costSaver ? Math.min(this.cfg.maxHistoryItems, 2) : this.cfg.maxHistoryItems
    const history = rawHistory.slice(-historyLimit).reduce<ScopeHistoryItem[]>((acc, x: any) => {
      const content = clampText(String(x?.content ?? ''), Math.floor(this.cfg.maxPromptChars / 2))
      if (!content) return acc
      acc.push({
        role: x?.role === 'assistant' ? 'assistant' : 'user',
        content,
      })
      return acc
    }, [])

    const sig = {
      endpoint: 'scope',
      model: this.cfg.openaiModel,
      prompt,
      history,
      maxScopeOutputTokens: this.cfg.maxScopeOutputTokens,
      tenantId,
    }
    const key = sha1Key(sig)
    const cached = this.scopeCache.get(key)
    if (cached) return { ...cached, cache: true }

    this.canSpend(tenantId)
    this.recordSpend(tenantId, prompt.length, this.cfg.maxScopeOutputTokens)

    return await this.dedupe.resolve(key, async () => {
      const payload = await this.callOpenAIJson({
        model: this.cfg.openaiModel,
        temperature: 0.2,
        max_tokens: this.cfg.maxScopeOutputTokens,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Eres un planificador experto de construccion. Responde SOLO JSON valido con esta forma exacta: { "title": string, "tasks": string[], "checklist": string[], "processEs": string[] }. Todo en espanol. processEs debe explicar el proceso paso a paso con detalle tecnico y orden de ejecucion.',
          },
          ...history,
          {
            role: 'user',
            content:
              `Genera un scope of work para estas tareas: ${prompt}. ` +
              'Checklist de acciones ejecutables. processEs con pasos detallados, control de calidad y cierre.',
          },
        ],
      })

      const content = payload?.choices?.[0]?.message?.content
      const parsed = typeof content === 'string' ? JSON.parse(content) : null
      if (!parsed || !parsed.title || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.checklist) || !Array.isArray(parsed.processEs)) {
        throw new Error('Invalid AI response format')
      }
      const out = {
        title: String(parsed.title),
        tasks: parsed.tasks.map((x: unknown) => String(x)).slice(0, 12),
        checklist: parsed.checklist.map((x: unknown) => String(x)).slice(0, 24),
        processEs: parsed.processEs.map((x: unknown) => String(x)).slice(0, 30),
        source: 'openai',
        cache: false,
      }
      this.scopeCache.set(key, out)
      return out
    })
  }

  async runMaterialPrices(payload: MaterialPricePayload) {
    const tenantId = this.tenantOrDefault(payload.tenantId)
    const itemName = clampText(String(payload.itemName ?? ''), this.cfg.maxPromptChars)
    const sku = clampText(String(payload.sku ?? ''), 120)
    const unit = clampText(String(payload.unit ?? 'ea'), 40)
    const location = clampText(String(payload.location ?? ''), 120)
    if (!itemName) throw new Error('itemName is required')

    const sig = {
      endpoint: 'material-prices',
      model: this.cfg.openaiPriceModel,
      itemName,
      sku,
      unit,
      location,
      maxPriceOutputTokens: this.cfg.maxPriceOutputTokens,
      tenantId,
    }
    const key = sha1Key(sig)
    const cached = this.priceCache.get(key)
    if (cached) return { ...cached, cache: true }

    this.canSpend(tenantId)
    this.recordSpend(tenantId, itemName.length + sku.length + unit.length + location.length, this.cfg.maxPriceOutputTokens)

    return await this.dedupe.resolve(key, async () => {
      const payload = await this.callOpenAIResponse({
        model: this.cfg.openaiPriceModel,
        max_output_tokens: this.cfg.maxPriceOutputTokens,
        tools: [{ type: 'web_search_preview' }],
        temperature: 0.1,
        text: {
          format: {
            type: 'json_schema',
            name: 'material_price_lookup',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                itemQuery: { type: 'string' },
                bestVendor: { type: 'string' },
                bestPrice: { type: 'number' },
                currency: { type: 'string' },
                summaryEs: { type: 'string' },
                exactMatchCount: { type: 'number' },
                coverage: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    homeDepot: { type: 'boolean' },
                    lowes: { type: 'boolean' },
                    amazon: { type: 'boolean' },
                    ebay: { type: 'boolean' },
                    facebookMarketplace: { type: 'boolean' },
                    localSupplier: { type: 'boolean' },
                  },
                  required: ['homeDepot', 'lowes', 'amazon', 'ebay', 'facebookMarketplace', 'localSupplier'],
                },
                options: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 12,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      vendor: { type: 'string' },
                      vendorType: { type: 'string' },
                      title: { type: 'string' },
                      price: { type: 'number' },
                      currency: { type: 'string' },
                      url: { type: 'string' },
                      distanceMiles: { type: ['number', 'null'] },
                      matchType: { type: 'string', enum: ['exact_sku', 'exact_upc', 'keyword'] },
                      unitMatch: { type: 'boolean' },
                      confidence: { type: 'number' },
                      shippingCost: { type: 'number' },
                      taxEstimate: { type: 'number' },
                      totalPrice: { type: 'number' },
                      checkedAt: { type: 'string' },
                      notesEs: { type: 'string' },
                    },
                    required: [
                      'vendor',
                      'vendorType',
                      'title',
                      'price',
                      'currency',
                      'url',
                      'distanceMiles',
                      'matchType',
                      'unitMatch',
                      'confidence',
                      'shippingCost',
                      'taxEstimate',
                      'totalPrice',
                      'checkedAt',
                      'notesEs',
                    ],
                  },
                },
              },
              required: ['itemQuery', 'bestVendor', 'bestPrice', 'currency', 'summaryEs', 'exactMatchCount', 'coverage', 'options'],
            },
          },
        },
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text:
                  'Eres un asistente de compras de construccion. Busca precios actuales y comparables del MISMO producto. ' +
                  'Prioriza coincidencias exactas por SKU/UPC, luego coincidencia por descripcion. ' +
                  'Siempre estima totalPrice = price + shippingCost + taxEstimate. Responde en JSON estricto.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text:
                  `Busca el mejor precio para este material: "${itemName}"` +
                  `${sku ? ` SKU: ${sku}.` : '.'} Unidad: ${unit}. ` +
                  `${location ? `Ubicacion local de referencia: ${location}. ` : ''}` +
                  'Debes incluir opciones de Home Depot, Lowe\'s, Amazon, eBay, Facebook Marketplace y ademas tiendas/proveedores locales cuando existan. ' +
                  'vendorType debe ser uno de: big_box, local_store, marketplace. ' +
                  'matchType debe ser: exact_sku, exact_upc o keyword. ' +
                  'unitMatch debe ser true cuando la unidad/tamano coincide. confidence de 0 a 1. ' +
                  'En summaryEs explica brevemente cual conviene y por que.',
              },
            ],
          },
        ],
      })

      const text = extractResponseText(payload)
      if (!text) throw new Error('Empty AI response')
      const parsed = JSON.parse(text) as any

      const optionsRaw = Array.isArray(parsed?.options) ? parsed.options : []
      const options = optionsRaw
        .map((x: any) => {
          const distanceRaw = Number(x?.distanceMiles ?? NaN)
          const confidenceRaw = Number(x?.confidence ?? NaN)
          const shippingRaw = Number(x?.shippingCost ?? NaN)
          const taxRaw = Number(x?.taxEstimate ?? NaN)
          const totalRaw = Number(x?.totalPrice ?? NaN)
          const unitMatch = Boolean(x?.unitMatch)
          const matchTypeRaw = String(x?.matchType ?? 'keyword').trim().toLowerCase()
          const matchType =
            matchTypeRaw === 'exact_sku' || matchTypeRaw === 'exact_upc' || matchTypeRaw === 'keyword'
              ? matchTypeRaw
              : 'keyword'
          const price = Number(x?.price ?? 0)
          const shippingCost = Number.isFinite(shippingRaw) && shippingRaw >= 0 ? shippingRaw : 0
          const taxEstimate = Number.isFinite(taxRaw) && taxRaw >= 0 ? taxRaw : 0
          const totalPrice = Number.isFinite(totalRaw) && totalRaw > 0 ? totalRaw : price + shippingCost + taxEstimate
          return {
            vendor: String(x?.vendor ?? '').trim(),
            vendorType: String(x?.vendorType ?? '').trim(),
            title: String(x?.title ?? '').trim(),
            price,
            currency: String(x?.currency ?? 'USD').trim() || 'USD',
            url: String(x?.url ?? '').trim(),
            distanceMiles: Number.isFinite(distanceRaw) && distanceRaw >= 0 ? distanceRaw : undefined,
            matchType,
            unitMatch,
            confidence: Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(1, confidenceRaw)) : 0.5,
            shippingCost,
            taxEstimate,
            totalPrice,
            checkedAt: String(x?.checkedAt ?? new Date().toISOString()).trim() || new Date().toISOString(),
            notesEs: String(x?.notesEs ?? '').trim(),
          }
        })
        .filter((x: any) => x.vendor && x.vendorType && x.title && Number.isFinite(x.price) && x.price > 0 && /^https?:\/\//i.test(x.url))
      if (!options.length) throw new Error('AI did not return valid price options')

      function matchRank(op: any) {
        if (op.matchType === 'exact_sku') return 3
        if (op.matchType === 'exact_upc') return 2
        return 1
      }
      const sorted = options
        .slice()
        .sort((a: any, b: any) => {
          const rDiff = matchRank(b) - matchRank(a)
          if (rDiff !== 0) return rDiff
          if (a.unitMatch !== b.unitMatch) return a.unitMatch ? -1 : 1
          if (a.totalPrice !== b.totalPrice) return a.totalPrice - b.totalPrice
          return b.confidence - a.confidence
        })
      const bestByScore = sorted[0]
      const bestPrice = Number(parsed?.bestPrice ?? bestByScore.price)
      const bestVendor = String(parsed?.bestVendor ?? bestByScore.vendor).trim() || bestByScore.vendor
      const currency = String(parsed?.currency ?? bestByScore.currency).trim() || bestByScore.currency
      const exactMatchCount = options.filter((x: any) => x.matchType === 'exact_sku' || x.matchType === 'exact_upc').length
      const coverage = {
        homeDepot: options.some((x: any) => /home\s*depot/i.test(x.vendor)),
        lowes: options.some((x: any) => /lowe'?s/i.test(x.vendor)),
        amazon: options.some((x: any) => /amazon/i.test(x.vendor)),
        ebay: options.some((x: any) => /ebay/i.test(x.vendor)),
        facebookMarketplace: options.some((x: any) => /facebook|marketplace/i.test(x.vendor)),
        localSupplier: options.some((x: any) => x.vendorType === 'local_store'),
      }

      const out = {
        itemQuery: String(parsed?.itemQuery ?? itemName).trim() || itemName,
        bestVendor,
        bestPrice: Number.isFinite(bestPrice) && bestPrice > 0 ? bestPrice : bestByScore.price,
        currency,
        summaryEs: String(parsed?.summaryEs ?? `Se compararon ${options.length} opciones.`).trim(),
        exactMatchCount: Number.isFinite(Number(parsed?.exactMatchCount))
          ? Math.max(0, Math.trunc(Number(parsed?.exactMatchCount)))
          : exactMatchCount,
        coverage: {
          homeDepot: Boolean(parsed?.coverage?.homeDepot ?? coverage.homeDepot),
          lowes: Boolean(parsed?.coverage?.lowes ?? coverage.lowes),
          amazon: Boolean(parsed?.coverage?.amazon ?? coverage.amazon),
          ebay: Boolean(parsed?.coverage?.ebay ?? coverage.ebay),
          facebookMarketplace: Boolean(parsed?.coverage?.facebookMarketplace ?? coverage.facebookMarketplace),
          localSupplier: Boolean(parsed?.coverage?.localSupplier ?? coverage.localSupplier),
        },
        options: options.slice(0, 12),
        source: 'openai_web_search',
        searchedAt: new Date().toISOString(),
        cache: false,
      }
      this.priceCache.set(key, out)
      return out
    })
  }
}
