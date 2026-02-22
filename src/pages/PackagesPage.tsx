import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  archiveQuotePackage,
  createQuotePackage,
  listInventoryItems,
  listQuotePackages,
  updateQuotePackage,
  type InventoryItem,
  type QuotePackage,
} from '../api/client'
import { DataTable } from '../components/tables/DataTable'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { money } from '../components/ui/MoneyInput'
import { Select } from '../components/ui/Select'

type DraftItem = {
  id: string
  itemNo: string
  description: string
  qty: number
  unitPrice: number
  kind: 'Material' | 'Labor'
  inventoryItemId: string
}

export function PackagesPage() {
  const [packages, setPackages] = useState<QuotePackage[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])

  const [name, setName] = useState('')
  const [specifications, setSpecifications] = useState('')
  const [includesText, setIncludesText] = useState('')
  const [items, setItems] = useState<DraftItem[]>([
    {
      id: `d_${crypto.randomUUID()}`,
      itemNo: 'PKG-ITEM-001',
      description: '',
      qty: 1,
      unitPrice: 0,
      kind: 'Material',
      inventoryItemId: '',
    },
  ])

  async function refresh() {
    const next = await listQuotePackages()
    setPackages(next)
  }

  useEffect(() => {
    refresh().catch(() => setPackages([]))
    listInventoryItems()
      .then((inv) => setInventoryItems(inv.filter((x) => !x.archivedAt && x.type === 'Material')))
      .catch(() => setInventoryItems([]))
  }, [])

  function resetForm() {
    setEditingId(null)
    setName('')
    setSpecifications('')
    setIncludesText('')
    setItems([
      {
        id: `d_${crypto.randomUUID()}`,
        itemNo: 'PKG-ITEM-001',
        description: '',
        qty: 1,
        unitPrice: 0,
        kind: 'Material',
        inventoryItemId: '',
      },
    ])
  }

  const visible = useMemo(
    () => (showArchived ? packages : packages.filter((p) => !p.archivedAt)),
    [packages, showArchived],
  )

  const cols = useMemo<ColumnDef<QuotePackage>[]>(
    () => [
      { header: 'Package', accessorKey: 'name' },
      { header: 'Specifications', accessorKey: 'specifications' },
      { header: 'Includes', accessorKey: 'includes' },
      {
        header: 'Items',
        cell: ({ row }) => <span>{row.original.items.length}</span>,
      },
      {
        header: 'Package total',
        cell: ({ row }) => {
          const total = row.original.items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0)
          return <span style={{ fontWeight: 900 }}>{money.fmt(total)}</span>
        },
      },
      {
        header: 'Actions',
        cell: ({ row }) => (
          <div className="row">
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const p = row.original
                setEditingId(p.id)
                setName(p.name)
                setSpecifications(p.specifications ?? '')
                setIncludesText(p.includes ?? '')
                setItems(
                  (p.items ?? []).map((it) => ({
                    id: it.id,
                    itemNo: it.itemNo,
                    description: it.description,
                    qty: it.qty,
                    unitPrice: it.unitPrice,
                    kind: it.kind ?? 'Material',
                    inventoryItemId: it.inventoryItemId ?? '',
                  })),
                )
              }}
            >
              Edit
            </Button>
            {!row.original.archivedAt ? (
              <Button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation()
                  await archiveQuotePackage(row.original.id)
                  await refresh()
                }}
              >
                Archive
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [],
  )

  async function savePackage() {
    const cleanItems = items
      .map((it) => ({
        itemNo: it.itemNo.trim(),
        description: it.description.trim(),
        qty: Number(it.qty) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        kind: it.kind,
        inventoryItemId: it.kind === 'Material' && it.inventoryItemId ? it.inventoryItemId : null,
      }))
      .filter((it) => it.description.length > 0)
    if (!name.trim() || cleanItems.length === 0) return

    if (editingId) {
      const existing = packages.find((p) => p.id === editingId)
      if (!existing) return
      const updated: QuotePackage = {
        ...existing,
        name: name.trim(),
        specifications: specifications.trim(),
        includes: includesText.trim(),
        items: cleanItems.map((it, idx) => ({
          id: existing.items[idx]?.id ?? `pitem_${crypto.randomUUID()}`,
          ...it,
        })),
      }
      await updateQuotePackage(updated)
    } else {
      await createQuotePackage({
        name: name.trim(),
        specifications: specifications.trim(),
        includes: includesText.trim(),
        items: cleanItems,
      })
    }
    await refresh()
    resetForm()
  }

  return (
    <Card>
      <CardHeader
        title="Packages"
        subtitle="Create pre-made packages and use them in quotes."
        right={
          <Button type="button" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>
        }
      />
      <CardBody>
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 14, display: 'grid', gap: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 900 }}>{editingId ? 'Edit Package' : 'Create Package'}</div>
                <div className="help">Set specs, included scope, and line items.</div>
              </div>
              {editingId ? (
                <Button type="button" onClick={resetForm}>
                  Cancel Edit
                </Button>
              ) : null}
            </div>

            <div className="grid2">
              <div className="field">
                <div className="label">Package name</div>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <div className="label">What is included</div>
                <Input value={includesText} onChange={(e) => setIncludesText(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <div className="label">Specifications</div>
              <Textarea rows={3} value={specifications} onChange={(e) => setSpecifications(e.target.value)} />
            </div>

            <div className="card" style={{ padding: 12 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="label">Package Items</div>
                <Button
                  type="button"
                  onClick={() =>
                    setItems((prev) => [
                      ...prev,
                      {
                        id: `d_${crypto.randomUUID()}`,
                        itemNo: `PKG-ITEM-${String(prev.length + 1).padStart(3, '0')}`,
                        description: '',
                        qty: 1,
                        unitPrice: 0,
                        kind: 'Material',
                        inventoryItemId: '',
                      },
                    ])
                  }
                >
                  Add Item
                </Button>
              </div>
              <div className="tableWrap" style={{ marginTop: 8 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Item #</th>
                      <th>Description</th>
                      <th>Inventory Link</th>
                      <th>Qty</th>
                      <th>Unit price</th>
                      <th>Line total</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td style={{ width: 130 }}>
                          <Select
                            value={it.kind}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((x) =>
                                  x.id === it.id
                                    ? {
                                        ...x,
                                        kind: e.target.value as 'Material' | 'Labor',
                                        inventoryItemId: e.target.value === 'Material' ? x.inventoryItemId : '',
                                      }
                                    : x,
                                ),
                              )
                            }
                          >
                            <option value="Material">Material</option>
                            <option value="Labor">Labor</option>
                          </Select>
                        </td>
                        <td style={{ width: 170 }}>
                          <Input
                            value={it.itemNo}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((x) => (x.id === it.id ? { ...x, itemNo: e.target.value } : x)),
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            value={it.description}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((x) => (x.id === it.id ? { ...x, description: e.target.value } : x)),
                              )
                            }
                          />
                        </td>
                        <td style={{ width: 250 }}>
                          <Select
                            disabled={it.kind !== 'Material'}
                            value={it.kind === 'Material' ? it.inventoryItemId : ''}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((x) =>
                                  x.id === it.id ? { ...x, inventoryItemId: e.target.value } : x,
                                ),
                              )
                            }
                          >
                            <option value="">Not linked</option>
                            {inventoryItems.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.name} ({inv.qtyOnHand} on hand)
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td style={{ width: 90 }}>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={it.qty}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((x) =>
                                  x.id === it.id ? { ...x, qty: Math.max(0, Number(e.target.value) || 0) } : x,
                                ),
                              )
                            }
                          />
                        </td>
                        <td style={{ width: 170 }}>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={it.unitPrice}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((x) =>
                                  x.id === it.id
                                    ? { ...x, unitPrice: Math.max(0, Number(e.target.value) || 0) }
                                    : x,
                                ),
                              )
                            }
                          />
                        </td>
                        <td style={{ fontWeight: 900, width: 150 }}>{money.fmt(it.qty * it.unitPrice)}</td>
                        <td style={{ width: 60 }}>
                          <Button
                            type="button"
                            onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                          >
                            X
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button type="button" variant="primary" onClick={savePackage}>
                {editingId ? 'Save Package' : 'Create Package'}
              </Button>
            </div>
          </div>

          <DataTable
            data={visible}
            columns={cols}
            emptyTitle="No packages"
            emptyDescription="Create a package to reuse it in project quotes."
          />
        </div>
      </CardBody>
    </Card>
  )
}
