import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import {
  adjustInventoryQty,
  archiveInventoryItem,
  archiveSupplier,
  createInventoryItem,
  createSupplier,
  getRetailSnapshots,
  listInventoryItems,
  listSuppliers,
  updateInventoryItem,
  type InventoryItem,
  type InventoryItemType,
  type Supplier,
} from '../../api/client'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { DataTable } from '../tables/DataTable'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Modal } from '../ui/Modal'
import { Badge } from '../ui/Badge'
import { MoneyInput, money } from '../ui/MoneyInput'

const supplierSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
})

type SupplierFormValues = z.infer<typeof supplierSchema>

const itemSchema = z.object({
  type: z.enum(['Material', 'Tool']),
  category: z.string().optional(),
  name: z.string().min(2),
  sku: z.string().optional(),
  unit: z.string().min(1),
  supplierId: z.string().optional(),
  unitCost: z.number().min(0),
  qtyOnHand: z.number().min(0),
  reorderPoint: z.number().min(0),
  reorderQty: z.number().min(0),
  notes: z.string().optional(),
}).superRefine((v, ctx) => {
  if (v.type === 'Material' && (!v.category || !v.category.trim())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Category is required for materials', path: ['category'] })
  }
})

type ItemFormValues = z.infer<typeof itemSchema>
type MaterialPriceOption = {
  vendor: string
  vendorType: string
  title: string
  price: number
  currency: string
  url: string
  distanceMiles?: number
  matchType?: 'exact_sku' | 'exact_upc' | 'keyword'
  unitMatch?: boolean
  confidence?: number
  shippingCost?: number
  taxEstimate?: number
  totalPrice?: number
  checkedAt?: string
  notesEs?: string
}

type MaterialPriceLookup = {
  itemQuery: string
  bestVendor: string
  bestPrice: number
  currency: string
  summaryEs: string
  exactMatchCount?: number
  coverage?: {
    homeDepot?: boolean
    lowes?: boolean
    amazon?: boolean
    ebay?: boolean
    facebookMarketplace?: boolean
    localSupplier?: boolean
  }
  options: MaterialPriceOption[]
  source: string
  searchedAt: string
}

function toInt(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.trunc(n))
}

export function InventoryTab() {
  type InventoryView = 'materials' | 'tools' | 'suppliers' | 'purchaseOrders'
  type MaterialCategory = 'All' | 'Drywall' | 'Electrical' | 'Plumbing' | 'Paint' | 'Cabinets' | 'General' | 'Uncategorized'

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [pos, setPos] = useState<
    Array<{ id: string; projectId: string; vendor: string; color: string; items: string[] }>
  >([])

  const [view, setView] = useState<InventoryView>('materials')
  const [openSupplier, setOpenSupplier] = useState(false)
  const [openItem, setOpenItem] = useState(false)
  const [itemMode, setItemMode] = useState<'new' | 'edit'>('new')
  const [itemTypePreset, setItemTypePreset] = useState<InventoryItemType>('Material')
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [matCat, setMatCat] = useState<MaterialCategory>('All')
  const [priceOpen, setPriceOpen] = useState(false)
  const [priceBusy, setPriceBusy] = useState(false)
  const [priceItem, setPriceItem] = useState<InventoryItem | null>(null)
  const [priceResult, setPriceResult] = useState<MaterialPriceLookup | null>(null)
  const [priceError, setPriceError] = useState('')
  const [priceLocation, setPriceLocation] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null)
  const [actionMenuDirById, setActionMenuDirById] = useState<Record<string, 'up' | 'down'>>({})
  const [isPhone, setIsPhone] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 560px)').matches : false,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(max-width: 560px)')
    const onChange = () => setIsPhone(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  async function refresh() {
    const [s, it, snap] = await Promise.all([
      listSuppliers().catch(() => [] as Supplier[]),
      listInventoryItems().catch(() => [] as InventoryItem[]),
      getRetailSnapshots().catch(() => ({ purchaseOrders: [] as any[] })),
    ])
    setSuppliers(s)
    setItems(it)
    setPos((snap as any).purchaseOrders ?? [])
  }

  useEffect(() => {
    refresh()
  }, [])

  const supplierMap = useMemo(() => new Map(suppliers.map((s) => [s.id, s.name])), [suppliers])

  const visibleSuppliers = useMemo(
    () => (showArchived ? suppliers : suppliers.filter((s) => !s.archivedAt)),
    [suppliers, showArchived],
  )

  const visibleItems = useMemo(() => {
    const base = showArchived ? items : items.filter((it) => !it.archivedAt)
    if (view === 'materials') {
      const mats = base.filter((it) => it.type === 'Material')
      if (matCat === 'All') return mats
      return mats.filter((it) => ((it.category || 'Uncategorized') as MaterialCategory) === matCat)
    }
    if (view === 'tools') return base.filter((it) => it.type === 'Tool')
    return base
  }, [items, showArchived, view, matCat])

  const groupedMaterials = useMemo(() => {
    if (view !== 'materials') return [] as Array<{ category: MaterialCategory; items: InventoryItem[] }>
    const catsOrder: MaterialCategory[] = [
      'Drywall',
      'Electrical',
      'Plumbing',
      'Paint',
      'Cabinets',
      'General',
      'Uncategorized',
    ]
    const map = new Map<MaterialCategory, InventoryItem[]>()
    for (const it of visibleItems) {
      const c = ((it.category || 'Uncategorized') as MaterialCategory) || 'Uncategorized'
      if (!map.has(c)) map.set(c, [])
      map.get(c)!.push(it)
    }
    return catsOrder
      .filter((c) => map.get(c)?.length)
      .map((c) => ({ category: c, items: map.get(c)! }))
  }, [visibleItems, view])

  const existingItems = useMemo(
    () => (showArchived ? items : items.filter((it) => !it.archivedAt)),
    [items, showArchived],
  )

  const searchResults = useMemo(() => {
    const q = itemSearch.trim().toLowerCase()
    if (!q) return [] as InventoryItem[]
    return existingItems
      .filter((it) =>
        [it.name, it.sku ?? '', it.category ?? '', it.type]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 10)
  }, [itemSearch, existingItems])

  const reorderCount = useMemo(() => {
    return visibleItems.filter(
      (it) => !it.archivedAt && (it.qtyOnHand ?? 0) <= (it.reorderPoint ?? 0),
    ).length
  }, [visibleItems])

  const supplierCols = useMemo<ColumnDef<Supplier>[]>(
    () => [
      { header: 'Supplier', accessorKey: 'name' },
      { header: 'Phone', accessorKey: 'phone' },
      ...(isPhone ? [] : ([{ header: 'Email', accessorKey: 'email' }] as ColumnDef<Supplier>[])),
      {
        header: 'Status',
        cell: ({ row }) =>
          row.original.archivedAt ? <Badge tone="navy">Archived</Badge> : <Badge tone="gold">Active</Badge>,
      },
      ...(isPhone
        ? []
        : ([
            {
              header: 'Actions',
              cell: ({ row }) => {
                const s = row.original
                if (s.archivedAt) return <span className="help">-</span>
                return (
                  <Button
                    type="button"
                    onClick={async () => {
                      const ok = window.confirm(`Archive supplier \"${s.name}\"?`)
                      if (!ok) return
                      await archiveSupplier(s.id)
                      await refresh()
                    }}
                  >
                    Archive
                  </Button>
                )
              },
            },
          ] as ColumnDef<Supplier>[])),
    ],
    [isPhone],
  )

  const itemCols = useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      ...(isPhone
        ? []
        : ([
            { header: 'Type', accessorKey: 'type' },
            { header: 'Category', accessorKey: 'category' },
          ] as ColumnDef<InventoryItem>[])),
      {
        header: 'Item',
        cell: ({ row }) => {
          const it = row.original
          return (
            <span
              data-inv-item-id={it.id}
              className={focusedItemId === it.id ? 'invItemFocused' : ''}
              style={{ fontWeight: 700 }}
            >
              {it.name}
            </span>
          )
        },
      },
      ...(isPhone ? [] : ([{ header: 'SKU', accessorKey: 'sku' }] as ColumnDef<InventoryItem>[])),
      {
        header: 'Supplier',
        cell: ({ row }) => <span>{row.original.supplierId ? supplierMap.get(row.original.supplierId) ?? '-' : '-'}</span>,
      },
      ...(isPhone
        ? []
        : ([
            {
              header: 'Unit Cost',
              cell: ({ row }) => <span>{money.fmt(row.original.unitCost ?? 0)}</span>,
            },
          ] as ColumnDef<InventoryItem>[])),
      {
        header: 'On Hand',
        cell: ({ row }) => (
          <span>
            {row.original.qtyOnHand} {row.original.unit}
          </span>
        ),
      },
      ...(isPhone
        ? []
        : ([
            {
              header: 'Reorder At',
              cell: ({ row }) => (
                <span>
                  {row.original.reorderPoint} {row.original.unit}
                </span>
              ),
            },
          ] as ColumnDef<InventoryItem>[])),
      {
        header: 'Status',
        cell: ({ row }) => {
          const it = row.original
          if (it.archivedAt) return <Badge tone="navy">Archived</Badge>
          const needs = (it.qtyOnHand ?? 0) <= (it.reorderPoint ?? 0)
          return needs ? <Badge tone="gold" className="invReordBadge">Reord</Badge> : <Badge tone="navy">OK</Badge>
        },
      },
      {
        header: 'Actions',
        cell: ({ row }) => {
          const it = row.original
          if (it.archivedAt) return <span className="help">-</span>
          return (
            <details
              className={`invActionMenu ${actionMenuDirById[it.id] === 'up' ? 'invActionMenuUp' : 'invActionMenuDown'}`.trim()}
              onToggle={(e) => {
                const el = e.currentTarget
                if (!el.open) return
                const list = el.querySelector('.invActionMenuList') as HTMLElement | null
                const rect = el.getBoundingClientRect()
                const spaceBelow = window.innerHeight - rect.bottom
                const spaceAbove = rect.top
                const needed = Math.min((list?.scrollHeight ?? 280) + 12, 360)
                const nextDir: 'up' | 'down' = spaceBelow >= needed || spaceBelow >= spaceAbove ? 'down' : 'up'
                setActionMenuDirById((prev) => (prev[it.id] === nextDir ? prev : { ...prev, [it.id]: nextDir }))
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseLeave={(e) => {
                e.currentTarget.open = false
              }}
            >
                    <summary className="invActionMenuBtn invActionMenuBtnIcon" aria-label="Actions" title="Actions">
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="invKebabIcon">
                        <circle cx="12" cy="5" r="1.9" />
                        <circle cx="12" cy="12" r="1.9" />
                        <circle cx="12" cy="19" r="1.9" />
                      </svg>
                    </summary>
              <div className="invActionMenuList">
                <button
                  type="button"
                  className="invActionItem invActionTone1"
                  onClick={async (e) => {
                    e.stopPropagation()
                    const raw = window.prompt('Receive quantity:', '1')
                    if (!raw) return
                    const n = toInt(Number(raw))
                    if (!n) return
                    await adjustInventoryQty(it.id, n)
                    await refresh()
                  }}
                >
                  Receive
                </button>
                <button
                  type="button"
                  className="invActionItem invActionTone2"
                  onClick={async (e) => {
                    e.stopPropagation()
                    const raw = window.prompt('Use quantity:', '1')
                    if (!raw) return
                    const n = toInt(Number(raw))
                    if (!n) return
                    await adjustInventoryQty(it.id, -n)
                    await refresh()
                  }}
                >
                  Use
                </button>
                <button
                  type="button"
                  className="invActionItem invActionTone3"
                  onClick={async (e) => {
                    e.stopPropagation()
                    const raw = window.prompt('Set "On Hand" quantity to:', String(it.qtyOnHand ?? 0))
                    if (raw === null) return
                    const nextQty = toInt(Number(raw))
                    const current = toInt(Number(it.qtyOnHand ?? 0))
                    const delta = nextQty - current
                    if (!delta) return
                    await adjustInventoryQty(it.id, delta)
                    await refresh()
                  }}
                >
                  Set On Hand
                </button>
                <button
                  type="button"
                  className="invActionItem invActionTone4"
                  onClick={async (e) => {
                    e.stopPropagation()
                    await runAiPriceLookup(it, priceLocation)
                  }}
                >
                  AI Best Price
                </button>
                <button
                  type="button"
                  className="invActionItem invActionTone5"
                  onClick={(e) => {
                    e.stopPropagation()
                    setItemMode('edit')
                    setEditingItem(it)
                    setItemTypePreset(it.type)
                    resetItem({
                      type: it.type,
                      category: it.category ?? (it.type === 'Material' ? 'General' : ''),
                      name: it.name,
                      sku: it.sku ?? '',
                      unit: it.unit ?? 'ea',
                      supplierId: it.supplierId ?? '',
                      unitCost: it.unitCost ?? 0,
                      qtyOnHand: it.qtyOnHand ?? 0,
                      reorderPoint: it.reorderPoint ?? 0,
                      reorderQty: it.reorderQty ?? 0,
                      notes: it.notes ?? '',
                    })
                    setOpenItem(true)
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="invActionItem invActionTone6"
                  onClick={async (e) => {
                    e.stopPropagation()
                    const ok = window.confirm(`Archive item \"${it.name}\"?`)
                    if (!ok) return
                    await archiveInventoryItem(it.id)
                    await refresh()
                  }}
                >
                  Archive
                </button>
              </div>
            </details>
          )
        },
      },
    ],
    [supplierMap, focusedItemId, isPhone],
  )

  const supplierForm = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: '', phone: '', email: '', website: '', notes: '' },
  })
  const {
    register: regSupplier,
    handleSubmit: submitSupplier,
    reset: resetSupplier,
    formState: { errors: supplierErrors, isSubmitting: supplierSubmitting },
  } = supplierForm

  const itemForm = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      type: 'Material',
      category: 'General',
      name: '',
      sku: '',
      unit: 'ea',
      supplierId: '',
      unitCost: 0,
      qtyOnHand: 0,
      reorderPoint: 0,
      reorderQty: 0,
      notes: '',
    },
  })
  const {
    register: regItem,
    handleSubmit: submitItem,
    reset: resetItem,
    setValue: setItemValue,
    watch: watchItem,
    formState: { errors: itemErrors, isSubmitting: itemSubmitting },
  } = itemForm

  const currentUnitCost = watchItem('unitCost')

  function openNewItem(type: InventoryItemType) {
    setItemMode('new')
    setEditingItem(null)
    setItemTypePreset(type)
    resetItem({
      type,
      category: type === 'Material' ? 'General' : '',
      name: '',
      sku: '',
      unit: 'ea',
      supplierId: '',
      unitCost: 0,
      qtyOnHand: 0,
      reorderPoint: 0,
      reorderQty: 0,
      notes: '',
    })
    setOpenItem(true)
  }

  function goToItem(item: InventoryItem) {
    const nextView: InventoryView = item.type === 'Tool' ? 'tools' : 'materials'
    setView(nextView)
    if (nextView === 'materials') {
      setMatCat(((item.category || 'Uncategorized') as MaterialCategory) || 'Uncategorized')
    }
    setFocusedItemId(item.id)
    setTimeout(() => {
      const el = document.querySelector(`[data-inv-item-id="${item.id}"]`) as HTMLElement | null
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
    setTimeout(() => setFocusedItemId((cur) => (cur === item.id ? null : cur)), 2600)
  }

  async function runAiPriceLookup(item: InventoryItem, location?: string) {
    setPriceItem(item)
    setPriceResult(null)
    setPriceError('')
    setPriceBusy(true)
    setPriceOpen(true)
    try {
      const resp = await fetch('/api/ai/material-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: item.name,
          sku: item.sku ?? '',
          unit: item.unit ?? 'ea',
          location: (location ?? '').trim(),
        }),
      })
      const data = (await resp.json()) as any
      if (!resp.ok) throw new Error(String(data?.error ?? 'Failed to fetch prices'))
      setPriceResult(data as MaterialPriceLookup)
    } catch (error) {
      setPriceError(error instanceof Error ? error.message : 'Failed to fetch prices')
    } finally {
      setPriceBusy(false)
    }
  }

  return (
    <div className="inventoryPage" style={{ display: 'grid', gap: 16 }}>
      <Card>
        <CardHeader
          title="Inventory"
          subtitle="Materials, tools, suppliers, and stock levels "
          right={
            <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
              {view === 'materials' ? (
                <Button type="button" variant="primary" onClick={() => openNewItem('Material')}>
                  Add Material
                </Button>
              ) : null}
              {view === 'tools' ? (
                <Button type="button" variant="primary" onClick={() => openNewItem('Tool')}>
                  Add Tool
                </Button>
              ) : null}
              {view === 'suppliers' ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    resetSupplier()
                    setOpenSupplier(true)
                  }}
                >
                  Add Supplier
                </Button>
              ) : null}
              <Button type="button" onClick={() => setShowArchived((v) => !v)}>
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </Button>
            </div>
          }
        />
        <CardBody>
          <div className="row invControlsRow" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {view === 'materials' || view === 'tools' ? (
              <div className="field invSearchField" style={{ minWidth: 360, position: 'relative' }}>
                <div className="label">Search Existing Items</div>
                <Input
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Search by name, SKU, category..."
                />
                {itemSearch.trim() && searchResults.length ? (
                  <div className="invSearchResults">
                    {searchResults.map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        className="invSearchResultBtn"
                        onClick={() => {
                          goToItem(it)
                          setItemSearch('')
                        }}
                      >
                        <span style={{ fontWeight: 800 }}>{it.name}</span>
                        <span className="help">
                          {it.type}
                          {it.category ? ` - ${it.category}` : ''}
                          {it.sku ? ` - SKU: ${it.sku}` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="field invMenuField" style={{ minWidth: 320 }}>
              <div className="label">Menu</div>
              <div className="segGroup invSegGroup" role="tablist" aria-label="Inventory menu">
                <button
                  type="button"
                  className={`segBtn ${view === 'materials' ? 'segBtnActive' : ''}`.trim()}
                  onClick={() => setView('materials')}
                >
                  Materials
                </button>
                <button
                  type="button"
                  className={`segBtn ${view === 'tools' ? 'segBtnActive' : ''}`.trim()}
                  onClick={() => setView('tools')}
                >
                  Tools
                </button>
                <button
                  type="button"
                  className={`segBtn ${view === 'suppliers' ? 'segBtnActive' : ''}`.trim()}
                  onClick={() => setView('suppliers')}
                >
                  Suppliers
                </button>
                <button
                  type="button"
                  className={`segBtn ${view === 'purchaseOrders' ? 'segBtnActive' : ''}`.trim()}
                  onClick={() => setView('purchaseOrders')}
                >
                  Purchase Orders
                </button>
              </div>
            </div>

            {view === 'materials' || view === 'tools' ? (
              <>
                {view === 'materials' ? (
                  <div className="field invCategoriesField" style={{ minWidth: 520 }}>
                    <div className="label">Categories</div>
                    <select
                      className="select"
                      value={matCat}
                      aria-label="Material categories"
                      onChange={(e) => setMatCat(e.target.value as MaterialCategory)}
                      style={{ maxWidth: 280 }}
                    >
                      {(
                        [
                          'All',
                          'Drywall',
                          'Electrical',
                          'Plumbing',
                          'Paint',
                          'Cabinets',
                          'General',
                          'Uncategorized',
                        ] as MaterialCategory[]
                      ).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="field" style={{ minWidth: 220 }}>
                  <div className="label">Reorder Items</div>
                  <div style={{ fontWeight: 900, marginTop: 10 }}>{reorderCount}</div>
                </div>
                <div className="field" style={{ minWidth: 220 }}>
                  <div className="label">Total Items</div>
                  <div style={{ fontWeight: 900, marginTop: 10 }}>{visibleItems.length}</div>
                </div>
              </>
            ) : null}

            {view === 'suppliers' ? (
              <div className="field" style={{ minWidth: 220 }}>
                <div className="label">Total Suppliers</div>
                <div style={{ fontWeight: 900, marginTop: 10 }}>{visibleSuppliers.length}</div>
              </div>
            ) : null}

            {view === 'purchaseOrders' ? (
              <div className="field" style={{ minWidth: 220 }}>
                <div className="label">Total POs</div>
                <div style={{ fontWeight: 900, marginTop: 10 }}>{pos.length}</div>
              </div>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <Modal title="AI Best Price Search" open={priceOpen} onClose={() => setPriceOpen(false)} centered>
        <div className="invAiModal">
          <div className="field">
            <div className="label">Location (city or ZIP)</div>
            <div className="row invAiSearchRow">
              <Input
                value={priceLocation}
                onChange={(e) => setPriceLocation(e.target.value)}
                placeholder="e.g. Houston, TX or 77084"
              />
              <Button
                type="button"
                disabled={!priceItem || priceBusy}
                onClick={async () => {
                  if (!priceItem) return
                  await runAiPriceLookup(priceItem, priceLocation)
                }}
              >
                Search
              </Button>
            </div>
          </div>
          <div className="help invAiItemMeta">
            {priceItem ? `Item: ${priceItem.name}${priceItem.sku ? ` (SKU: ${priceItem.sku})` : ''}` : ''}
          </div>
          {priceBusy ? <div className="help invAiBusy">Searching Home Depot, Lowe&apos;s, Amazon, local stores and local marketplaces...</div> : null}
          {priceError ? <div className="bannerDanger">{priceError}</div> : null}

          {priceResult ? (
            <>
              <div className="card invAiBestCard" style={{ padding: 12 }}>
                <div className="label">Best Option</div>
                <div className="invAiBestValue" style={{ fontWeight: 900, marginTop: 6 }}>
                  {priceResult.bestVendor} - {money.fmt(priceResult.bestPrice)}
                </div>
                <div className="help" style={{ marginTop: 6 }}>
                  {priceResult.summaryEs}
                </div>
                <div className="help" style={{ marginTop: 6 }}>
                  Exact matches: {priceResult.exactMatchCount ?? 0} / {priceResult.options.length}
                </div>
                <div className="help" style={{ marginTop: 4 }}>
                  Coverage:
                  {' '}
                  {priceResult.coverage?.homeDepot ? 'HD ' : ''}
                  {priceResult.coverage?.lowes ? 'Lowe\'s ' : ''}
                  {priceResult.coverage?.amazon ? 'Amazon ' : ''}
                  {priceResult.coverage?.ebay ? 'eBay ' : ''}
                  {priceResult.coverage?.facebookMarketplace ? 'FB Market ' : ''}
                  {priceResult.coverage?.localSupplier ? 'Local' : ''}
                </div>
              </div>

              <div className="tableWrap invAiTableWrap">
                <table className="invAiTable">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Type</th>
                      <th>Item</th>
                      <th>Price</th>
                      <th>Distance</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceResult.options.map((op, idx) => (
                      <tr key={`${op.vendor}_${idx}`}>
                        <td>{op.vendor}</td>
                        <td>{op.vendorType}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{op.title}</div>
                          <div className="help">
                            {op.matchType === 'exact_sku'
                              ? 'Exact SKU'
                              : op.matchType === 'exact_upc'
                                ? 'Exact UPC'
                                : 'Keyword match'}
                            {op.unitMatch ? ' - Unit OK' : ' - Unit verify'}
                            {typeof op.confidence === 'number' ? ` - ${(op.confidence * 100).toFixed(0)}%` : ''}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{money.fmt(op.price)}</div>
                          <div className="help">
                            Total est:{' '}
                            {money.fmt(
                              typeof op.totalPrice === 'number'
                                ? op.totalPrice
                                : (op.price ?? 0) + (op.shippingCost ?? 0) + (op.taxEstimate ?? 0),
                            )}
                          </div>
                        </td>
                        <td>{typeof op.distanceMiles === 'number' ? `${op.distanceMiles.toFixed(1)} mi` : '-'}</td>
                        <td>
                          <a href={op.url} target="_blank" rel="noreferrer" className="help invAiOpenLink">
                            Open
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          <div className="row invAiActionsRow">
            <Button
              type="button"
              variant="primary"
              disabled={!priceItem || !priceResult || priceBusy}
              onClick={async () => {
                if (!priceItem || !priceResult) return
                await updateInventoryItem({
                  ...priceItem,
                  unitCost: Math.max(0, Number(priceResult.bestPrice) || 0),
                  notes: `${priceItem.notes ?? ''}\n[AI BEST PRICE] ${priceResult.bestVendor} ${priceResult.currency} ${priceResult.bestPrice} (${priceResult.searchedAt})`.trim(),
                })
                await refresh()
                setPriceOpen(false)
              }}
            >
              Apply Best Price
            </Button>
          </div>
        </div>
      </Modal>

      {view === 'materials' || view === 'tools' ? (
        view === 'materials' ? (
          <div style={{ display: 'grid', gap: 16 }}>
            {groupedMaterials.length ? (
              groupedMaterials.map((g, idx) => (
                <Card key={g.category}>
                  <details className="invCategoryDrop" open={matCat !== 'All' || idx === 0}>
                    <summary className="invCategoryDropSummary">
                      <span style={{ fontWeight: 900 }}>{g.category}</span>
                      <span className="badge badgeNavy">{g.items.length}</span>
                    </summary>
                    <CardBody>
                      <DataTable
                        data={g.items}
                        columns={itemCols}
                        emptyTitle="No items"
                        emptyDescription="No items in this category."
                      />
                    </CardBody>
                  </details>
                </Card>
              ))
            ) : (
              <Card>
                <CardHeader title="Items" subtitle="Track quantities, prices, reorder point, and supplier" />
                <CardBody>
                  <div className="help">
                    No materials yet. Add your first material to start tracking stock.
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardHeader title="Items" subtitle="Track quantities, prices, reorder point, and supplier" />
            <CardBody>
              <DataTable
                data={visibleItems}
                columns={itemCols}
                emptyTitle="No items"
                emptyDescription="Add your first tool to start tracking stock."
              />
            </CardBody>
          </Card>
        )
      ) : null}

      {view === 'suppliers' ? (
        <Card>
          <CardHeader title="Suppliers" subtitle="Vendors and contact info " />
          <CardBody>
            <DataTable
              data={visibleSuppliers}
              columns={supplierCols}
              emptyTitle="No suppliers"
              emptyDescription="Add suppliers to connect them to materials/tools."
            />
          </CardBody>
        </Card>
      ) : null}

      {view === 'purchaseOrders' ? (
        <Card>
          <CardHeader title="Purchase Orders" subtitle="Seeded PO list" />
          <CardBody>
            {!pos.length ? (
              <div className="help">No purchase orders.</div>
            ) : (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>PO</th>
                      <th>Project</th>
                      <th>Vendor</th>
                      <th>Color</th>
                      <th>Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pos.map((po) => (
                      <tr key={po.id}>
                        <td>{po.id}</td>
                        <td>{po.projectId}</td>
                        <td>{po.vendor}</td>
                        <td>{po.color}</td>
                        <td>{po.items.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      ) : null}

      <Modal
        title="Add Supplier"
        open={openSupplier}
        onClose={() => setOpenSupplier(false)}
      >
        <form
          onSubmit={submitSupplier(async (v) => {
            await createSupplier(v)
            setOpenSupplier(false)
            await refresh()
          })}
          style={{ display: 'grid', gap: 14 }}
        >
          <div className="field">
            <div className="label">Supplier name</div>
            <Input placeholder="Supplier" {...regSupplier('name')} />
            {supplierErrors.name ? <div className="error">{supplierErrors.name.message}</div> : null}
          </div>
          <div className="grid2">
            <div className="field">
              <div className="label">Phone</div>
              <Input placeholder="" {...regSupplier('phone')} />
            </div>
            <div className="field">
              <div className="label">Email</div>
              <Input placeholder="" {...regSupplier('email')} />
            </div>
          </div>
          <div className="grid2">
            <div className="field">
              <div className="label">Website</div>
              <Input placeholder="" {...regSupplier('website')} />
            </div>
            <div className="field">
              <div className="label">Notes</div>
              <Input placeholder="" {...regSupplier('notes')} />
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button type="button" onClick={() => setOpenSupplier(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={supplierSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        title={itemMode === 'edit' ? 'Edit Item' : `Add ${itemTypePreset}`}
        open={openItem}
        onClose={() => setOpenItem(false)}
      >
        <form
          onSubmit={submitItem(async (v) => {
            const supplierId = v.supplierId ? v.supplierId : null
            if (itemMode === 'edit' && editingItem) {
              await updateInventoryItem({
                ...editingItem,
                type: v.type,
                category: v.type === 'Material' ? (v.category ?? '') : '',
                name: v.name,
                sku: v.sku ?? '',
                unit: v.unit,
                supplierId,
                unitCost: v.unitCost,
                qtyOnHand: toInt(v.qtyOnHand),
                reorderPoint: toInt(v.reorderPoint),
                reorderQty: toInt(v.reorderQty),
                notes: v.notes ?? '',
              })
            } else {
              await createInventoryItem({
                type: v.type,
                category: v.type === 'Material' ? (v.category ?? '') : '',
                name: v.name,
                sku: v.sku ?? '',
                unit: v.unit,
                supplierId,
                unitCost: v.unitCost,
                qtyOnHand: toInt(v.qtyOnHand),
                reorderPoint: toInt(v.reorderPoint),
                reorderQty: toInt(v.reorderQty),
                notes: v.notes ?? '',
              })
            }
            setOpenItem(false)
            await refresh()
          })}
          style={{ display: 'grid', gap: 14 }}
        >
          <div className="grid2">
            <div className="field">
              <div className="label">Type</div>
              <Select {...regItem('type')} defaultValue={itemTypePreset}>
                <option value="Material">Material</option>
                <option value="Tool">Tool</option>
              </Select>
              {itemErrors.type ? <div className="error">{itemErrors.type.message}</div> : null}
            </div>
            <div className="field">
              <div className="label">Unit</div>
              <Input placeholder="ea / box / ft" {...regItem('unit')} />
              {itemErrors.unit ? <div className="error">{itemErrors.unit.message}</div> : null}
            </div>
          </div>

          {watchItem('type') === 'Material' ? (
            <div className="field">
              <div className="label">Category</div>
              <Select {...regItem('category')}>
                <option value="Drywall">Drywall</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Paint">Paint</option>
                <option value="Cabinets">Cabinets</option>
                <option value="General">General</option>
              </Select>
              {itemErrors.category ? <div className="error">{itemErrors.category.message}</div> : null}
            </div>
          ) : null}

          <div className="grid2">
            <div className="field">
              <div className="label">Name</div>
              <Input placeholder="Item name" {...regItem('name')} />
              {itemErrors.name ? <div className="error">{itemErrors.name.message}</div> : null}
            </div>
            <div className="field">
              <div className="label">SKU</div>
              <Input placeholder="" {...regItem('sku')} />
            </div>
          </div>

          <div className="field">
            <div className="label">Supplier</div>
            <Select {...regItem('supplierId')}>
              <option value="">-</option>
              {visibleSuppliers.filter((s) => !s.archivedAt).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid2">
            <div className="field">
              <div className="label">Unit cost</div>
              <MoneyInput value={currentUnitCost ?? 0} onChange={(n) => setItemValue('unitCost', n)} />
              {itemErrors.unitCost ? <div className="error">{itemErrors.unitCost.message}</div> : null}
            </div>
            <div className="field">
              <div className="label">Qty on hand</div>
              <Input type="number" min={0} step="1" {...regItem('qtyOnHand', { valueAsNumber: true })} />
              {itemErrors.qtyOnHand ? <div className="error">{itemErrors.qtyOnHand.message}</div> : null}
            </div>
          </div>

          <div className="grid2">
            <div className="field">
              <div className="label">Reorder point</div>
              <Input type="number" min={0} step="1" {...regItem('reorderPoint', { valueAsNumber: true })} />
              {itemErrors.reorderPoint ? <div className="error">{itemErrors.reorderPoint.message}</div> : null}
            </div>
            <div className="field">
              <div className="label">Reorder qty</div>
              <Input type="number" min={0} step="1" {...regItem('reorderQty', { valueAsNumber: true })} />
              {itemErrors.reorderQty ? <div className="error">{itemErrors.reorderQty.message}</div> : null}
            </div>
          </div>

          <div className="field">
            <div className="label">Notes</div>
            <Input placeholder="" {...regItem('notes')} />
          </div>

          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button type="button" onClick={() => setOpenItem(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={itemSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
