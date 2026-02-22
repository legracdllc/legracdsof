import { useEffect, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  adjustInventoryQty,
  approveProjectStartDate,
  getClient,
  getInvoice,
  listInventoryItems,
  getPaymentSchedule,
  getProject,
  listInvoiceItems,
  listQuotePackages,
  markInvoiceClientApproved,
  markInvoiceSent,
  proposeProjectStartDate,
  recordProjectDeposit,
  saveInvoice,
  saveInvoiceItems,
  savePaymentSchedule,
  type Client,
  type InventoryItem,
  type Invoice,
  type InvoiceItem,
  type PaymentSchedule,
  type Project,
  type QuotePackage,
} from '../api/client'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { MoneyInput, money } from '../components/ui/MoneyInput'
import { InvoicePreview } from '../components/invoice/InvoicePreview'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'

const itemSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  qty: z.number().min(0),
  itemNo: z.string().min(1),
  description: z.string().min(1),
  unitPrice: z.number().min(0),
})

const scheduleSchema = z.object({
  invoiceId: z.string(),
  downPayment: z.number().min(0),
  secondPayment: z.number().min(0),
  thirdPayment: z.number().min(0),
  finalPayment: z.number().min(0),
})

const schema = z.object({
  invoice: z.object({
    id: z.string(),
    projectId: z.string(),
    invoiceNo: z.string().min(1),
    type: z.enum(['Estimate', 'Invoice']),
    status: z.enum(['Draft', 'Sent', 'Paid', 'Voided']),
    salesperson: z.string().min(1),
    job: z.string().min(1),
    shippingMethod: z.string(),
    shippingTerms: z.string(),
    paymentTerms: z.string(),
    dueDate: z.string().min(1),
    discount: z.number().min(0),
  }),
  items: z.array(itemSchema).min(1),
  schedule: scheduleSchema,
})

type FormValues = z.infer<typeof schema>
type DraftPackageItem = {
  id: string
  itemNo: string
  description: string
  qty: number
  unitPrice: number
  kind: 'Material' | 'Labor'
  inventoryItemId: string
}

export function InvoiceDetailPage() {
  const nav = useNavigate()
  const { projectId, invoiceId } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [depositInput, setDepositInput] = useState(0)
  const [startDateInput, setStartDateInput] = useState(dayjs().add(14, 'day').format('YYYY-MM-DD'))
  const [packages, setPackages] = useState<QuotePackage[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState('')
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [packageDraftItems, setPackageDraftItems] = useState<DraftPackageItem[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: undefined,
    mode: 'onChange',
  })

  const { control, register, watch, setValue, handleSubmit, formState } = form

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    if (!projectId) return
    getProject(projectId).then(setProject)
  }, [projectId])

  useEffect(() => {
    if (!project?.clientId) return
    getClient(project.clientId).then(setClient)
  }, [project?.clientId])

  useEffect(() => {
    let alive = true
    async function load() {
      if (!invoiceId) return
      setLoading(true)
      const inv = await getInvoice(invoiceId)
      const items = await listInvoiceItems(invoiceId)
      const schedule = await getPaymentSchedule(invoiceId)
      if (!alive) return
      if (!inv || !schedule) {
        setLoading(false)
        return
      }
      form.reset({ invoice: inv, items, schedule })
      setLoading(false)
    }
    load().catch(() => setLoading(false))
    return () => {
      alive = false
    }
  }, [invoiceId, form])

  useEffect(() => {
    listQuotePackages()
      .then((p) => setPackages(p.filter((x) => !x.archivedAt)))
      .catch(() => setPackages([]))
    listInventoryItems()
      .then((inv) => setInventoryItems(inv.filter((x) => !x.archivedAt && x.type === 'Material')))
      .catch(() => setInventoryItems([]))
  }, [])

  const inv = watch('invoice') as Invoice | undefined
  const items = watch('items') as InvoiceItem[] | undefined
  const schedule = watch('schedule') as PaymentSchedule | undefined

  const totals = useMemo(() => {
    const isHiddenPackageComponent = (it: InvoiceItem) =>
      it.description.trim().startsWith('[PKGCOMP-')
    const orderTotal = (items ?? [])
      .filter((it) => !isHiddenPackageComponent(it))
      .reduce((sum, it) => sum + it.qty * it.unitPrice, 0)
    const discount = inv?.discount ?? 0
    const subtotal = orderTotal - discount
    const paySum =
      (schedule?.downPayment ?? 0) +
      (schedule?.secondPayment ?? 0) +
      (schedule?.thirdPayment ?? 0) +
      (schedule?.finalPayment ?? 0)
    return { orderTotal, discount, subtotal, paySum }
  }, [inv?.discount, items, schedule])

  const scheduleMismatch = Math.abs(totals.paySum - totals.subtotal) > 0.009
  const depositRequired = schedule?.downPayment ?? 0
  const depositReceived = (project?.depositAmount ?? 0) > 0
  const depositMeetsRequired = (project?.depositAmount ?? 0) + 0.0001 >= depositRequired
  const quoteSent = Boolean(inv?.sentAt) || inv?.status === 'Sent'
  const quoteApproved = Boolean(inv?.clientApprovedAt)
  const canProposeStart = Boolean(project?.depositReceivedAt) && depositMeetsRequired
  const canApproveStart = Boolean(project?.startDateProposed) && !project?.startDateApprovedAt
  const selectedPackage = packages.find((p) => p.id === selectedPackageId) ?? null

  useEffect(() => {
    if (!selectedPackage) {
      setPackageDraftItems([])
      return
    }
    setPackageDraftItems(
      selectedPackage.items.map((it) => ({
        id: `dpi_${crypto.randomUUID()}`,
        itemNo: it.itemNo,
        description: it.description,
        qty: it.qty,
        unitPrice: it.unitPrice,
        kind: it.kind ?? 'Material',
        inventoryItemId: it.inventoryItemId ?? '',
      })),
    )
  }, [selectedPackage])

  if (!projectId || !invoiceId) return null

  function invoiceForSave(v: FormValues['invoice']): Invoice {
    // Delivery date was removed from UI; keep it stable for storage compatibility.
    const keepDelivery =
      (inv as any)?.deliveryDate ?? dayjs().format('YYYY-MM-DD')
    return { ...(v as any), deliveryDate: keepDelivery } as Invoice
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Card>
        <CardHeader
          title={`Invoice / Estimate #${inv?.invoiceNo ?? ''}`}
          subtitle={project ? project.name : 'Loading project...'}
          right={
            <div className="row">
              <Button
                type="button"
                onClick={() => nav(`/projects/${projectId}/invoices`)}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  // TODO: real PDF export. Day 1 behavior: open print dialog (user can "Save as PDF").
                  window.print()
                }}
              >
                Export PDF (TODO)
              </Button>
            </div>
          }
        />
        <CardBody>
          {scheduleMismatch ? (
            <div className="bannerDanger">
              Payment schedule sum {money.fmt(totals.paySum)} does not match Sub Total{' '}
              {money.fmt(totals.subtotal)}. Mark as Sent is blocked (intentional).
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="invoiceTwoCol">
        <Card>
          <CardHeader
            title="Editor"
            subtitle="Items, discount, metadata, schedule"
            right={
              <div className="row">
                <Button
                  type="button"
                  variant="primary"
                  disabled={loading || formState.isSubmitting}
                  onClick={handleSubmit(async (v) => {
                    await saveInvoice(invoiceForSave(v.invoice))
                    await saveInvoiceItems(v.invoice.id, v.items)
                    await savePaymentSchedule(v.schedule)
                  })}
                >
                  Save 
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={scheduleMismatch || loading}
                  onClick={handleSubmit(async (v) => {
                    await saveInvoice({ ...invoiceForSave(v.invoice), status: 'Sent' })
                    await saveInvoiceItems(v.invoice.id, v.items)
                    await savePaymentSchedule(v.schedule)
                    setValue('invoice.status', 'Sent')
                  })}
                >
                  Mark as Sent
                </Button>
              </div>
            }
          />
          <CardBody>
            <div style={{ display: 'grid', gap: 18 }}>
              <Card>
                <div className="cardBody" style={{ display: 'grid', gap: 12 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <div className="label">Quote Workflow</div>
                      <div className="help">
                        Estimate is free. Plans + final quote access requires a deposit .
                      </div>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <Badge tone={quoteSent ? 'gold' : 'navy'}>{quoteSent ? 'Sent' : 'Draft'}</Badge>
                      <Badge tone={quoteApproved ? 'gold' : 'navy'}>
                        {quoteApproved ? 'Approved' : 'Awaiting approval'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid2">
                    <div className="card" style={{ padding: 12 }}>
                      <div className="label">Deposit Required</div>
                      <div style={{ fontWeight: 900, marginTop: 6 }}>{money.fmt(depositRequired)}</div>
                      <div className="help" style={{ marginTop: 6 }}>
                        Received: {money.fmt(project?.depositAmount ?? 0)}
                      </div>
                      <div className="help">
                        Status: {depositReceived ? (depositMeetsRequired ? 'OK' : 'Partial') : 'Not received'}
                      </div>
                    </div>

                    <div className="card" style={{ padding: 12 }}>
                      <div className="label">Client</div>
                      <div style={{ fontWeight: 900, marginTop: 6 }}>{client?.name ?? '-'}</div>
                      <div className="help" style={{ marginTop: 6 }}>Email: {client?.email ?? '-'}</div>
                      <div className="help">Phone: {client?.phone ?? '-'}</div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                    <Button
                      type="button"
                      variant="primary"
                      disabled={scheduleMismatch || loading || !inv}
                      onClick={async () => {
                        if (!inv) return
                        // Internal: user can save as PDF from print dialog.
                        window.print()
                        await markInvoiceSent(inv.id)
                        const latest = await getInvoice(inv.id)
                        if (latest) setValue('invoice', latest)
                      }}
                    >
                      Generate PDF + Send 
                    </Button>

                    <Button
                      type="button"
                      disabled={!inv || !quoteSent || quoteApproved}
                      onClick={async () => {
                        if (!inv) return
                        await markInvoiceClientApproved(inv.id)
                        const latest = await getInvoice(inv.id)
                        if (latest) setValue('invoice', latest)
                      }}
                    >
                      Mark Approved 
                    </Button>
                  </div>

                  <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                    <div className="field" style={{ minWidth: 220 }}>
                      <div className="label">Record Deposit</div>
                      <MoneyInput value={depositInput} onChange={setDepositInput} />
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      disabled={!projectId || depositInput <= 0}
                      onClick={async () => {
                        await recordProjectDeposit(projectId, depositInput)
                        setDepositInput(0)
                        const p = await getProject(projectId)
                        setProject(p)
                      }}
                    >
                      Record Deposit 
                    </Button>
                    <span className="help">
                      Deposit unlocks plans access and start-date proposal.
                    </span>
                  </div>

                  <div className="grid2">
                    <div className="field">
                      <div className="label">Propose Start Date</div>
                      <Input
                        type="date"
                        value={startDateInput}
                        onChange={(e) => setStartDateInput(e.target.value)}
                      />
                      <div className="help">
                        Current proposal: {project?.startDateProposed ?? '-'}
                      </div>
                    </div>
                    <div className="field">
                      <div className="label">Actions</div>
                      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                        <Button
                          type="button"
                          variant="primary"
                          disabled={!projectId || !canProposeStart}
                          onClick={async () => {
                            await proposeProjectStartDate(projectId, startDateInput)
                            const p = await getProject(projectId)
                            setProject(p)
                          }}
                        >
                          Send Start Date 
                        </Button>
                        <Button
                          type="button"
                          disabled={!projectId || !canApproveStart}
                          onClick={async () => {
                            await approveProjectStartDate(projectId)
                            const p = await getProject(projectId)
                            setProject(p)
                          }}
                        >
                          Approve Start Date 
                        </Button>
                      </div>
                      <div className="help" style={{ marginTop: 8 }}>
                        Start approved at: {project?.startDateApprovedAt ?? '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <form style={{ display: 'grid', gap: 18 }}>
              <div className="grid2">
                <div className="field">
                  <div className="label">Invoice / Estimate #</div>
                  <Input {...register('invoice.invoiceNo')} />
                </div>
                <div className="field">
                  <div className="label">Status</div>
                  <Input value={inv?.status ?? ''} disabled />
                </div>
                <div className="field">
                  <div className="label">Salesperson</div>
                  <Input {...register('invoice.salesperson')} />
                </div>
                <div className="field">
                  <div className="label">Job</div>
                  <Input {...register('invoice.job')} />
                </div>
              </div>

              <Card>
                <div className="cardBody" style={{ display: 'grid', gap: 14 }}>
                  <div className="label">Metadata</div>
                  <div className="grid2">
                    <div className="field">
                      <div className="label">Possible starting date</div>
                      <Input type="date" {...register('invoice.shippingMethod')} />
                    </div>
                    <div className="field">
                      <div className="label">Possible culmination date</div>
                      <Input type="date" {...register('invoice.shippingTerms')} />
                    </div>
                    <div className="field">
                      <div className="label">Payment terms</div>
                      <Input {...register('invoice.paymentTerms')} />
                    </div>
                    <div className="field">
                      <div className="label">Due date</div>
                      <Input type="date" {...register('invoice.dueDate')} />
                    </div>
                    <div className="field">
                      <div className="label">Discount</div>
                      <Controller
                        control={control}
                        name="invoice.discount"
                        render={({ field }) => (
                          <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
                        )}
                      />
                    </div>
                    <div className="field">
                      <div className="label">Computed Sub Total</div>
                      <Input value={money.fmt(totals.subtotal)} disabled />
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="cardBody" style={{ display: 'grid', gap: 10 }}>
                  <div className="card" style={{ padding: 12, background: 'rgba(14, 28, 40, 0.03)' }}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <div>
                        <div className="label">Packages</div>
                        <div className="help">
                          Add pre-made package items to this quote. You can edit qty/items before apply.
                        </div>
                      </div>
                      <div className="row">
                        <Select
                          value={selectedPackageId}
                          onChange={(e) => setSelectedPackageId(e.target.value)}
                          style={{ width: 'min(280px, 100%)' }}
                        >
                          <option value="">Select package...</option>
                          {packages.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </Select>
                        <Button
                          type="button"
                          disabled={!selectedPackage || packageDraftItems.length === 0}
                          onClick={async () => {
                            if (!selectedPackage || packageDraftItems.length === 0) return
                            const detailedItems = packageDraftItems.filter((it) => it.description.trim().length > 0)
                            if (!detailedItems.length) return
                            const packageTotal = detailedItems.reduce(
                              (sum, it) => sum + Math.max(0, Number(it.qty) || 0) * Math.max(0, Number(it.unitPrice) || 0),
                              0,
                            )
                            const headerNo = `PKG-${selectedPackage.name}`.toUpperCase().slice(0, 32)
                            const nextItems = [
                              {
                                id: `item_${crypto.randomUUID()}`,
                                invoiceId,
                                qty: 1,
                                itemNo: headerNo,
                                description:
                                  `Package: ${selectedPackage.name}` +
                                  (selectedPackage.specifications
                                    ? ` | Specs: ${selectedPackage.specifications}`
                                    : '') +
                                  (selectedPackage.includes ? ` | Includes: ${selectedPackage.includes}` : ''),
                                unitPrice: packageTotal,
                              },
                              ...detailedItems.map((it) => ({
                                id: `item_${crypto.randomUUID()}`,
                                invoiceId,
                                qty: it.qty,
                                itemNo: it.itemNo,
                                description:
                                  `[PKGCOMP-${it.kind.toUpperCase()}] ${selectedPackage.name} | ${it.description}` +
                                  (it.inventoryItemId ? ` | INV:${it.inventoryItemId}` : ''),
                                unitPrice: it.unitPrice,
                              })),
                            ]
                            append(nextItems)
                            for (const it of detailedItems) {
                              if (it.kind !== 'Material') continue
                              if (!it.inventoryItemId) continue
                              await adjustInventoryQty(it.inventoryItemId, -Math.max(0, Number(it.qty) || 0))
                            }
                          }}
                        >
                          Add Package to Quote
                        </Button>
                      </div>
                    </div>
                    {selectedPackage ? (
                      <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                        <div className="help">
                          {selectedPackage.specifications || 'No specifications'} | Includes:{' '}
                          {selectedPackage.includes || 'N/A'}
                        </div>
                        <div className="tableWrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Type</th>
                                <th>Item #</th>
                                <th>Description</th>
                                <th>Inventory Link</th>
                                <th>Qty</th>
                                <th>Unit price</th>
                                <th />
                              </tr>
                            </thead>
                            <tbody>
                              {packageDraftItems.map((it) => (
                                <tr key={it.id}>
                                  <td style={{ width: 120 }}>
                                    <Select
                                      value={it.kind}
                                      onChange={(e) =>
                                        setPackageDraftItems((prev) =>
                                          prev.map((x) =>
                                            x.id === it.id
                                              ? {
                                                  ...x,
                                                  kind: e.target.value as 'Material' | 'Labor',
                                                  inventoryItemId:
                                                    e.target.value === 'Material' ? x.inventoryItemId : '',
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
                                  <td style={{ width: 150 }}>
                                    <Input
                                      value={it.itemNo}
                                      onChange={(e) =>
                                        setPackageDraftItems((prev) =>
                                          prev.map((x) =>
                                            x.id === it.id ? { ...x, itemNo: e.target.value } : x,
                                          ),
                                        )
                                      }
                                    />
                                  </td>
                                  <td>
                                    <Input
                                      value={it.description}
                                      onChange={(e) =>
                                        setPackageDraftItems((prev) =>
                                          prev.map((x) =>
                                            x.id === it.id ? { ...x, description: e.target.value } : x,
                                          ),
                                        )
                                      }
                                    />
                                  </td>
                                  <td style={{ width: 220 }}>
                                    <Select
                                      disabled={it.kind !== 'Material'}
                                      value={it.kind === 'Material' ? it.inventoryItemId : ''}
                                      onChange={(e) =>
                                        setPackageDraftItems((prev) =>
                                          prev.map((x) =>
                                            x.id === it.id ? { ...x, inventoryItemId: e.target.value } : x,
                                          ),
                                        )
                                      }
                                    >
                                      <option value="">Not linked</option>
                                      {inventoryItems.map((invItem) => (
                                        <option key={invItem.id} value={invItem.id}>
                                          {invItem.name} ({invItem.qtyOnHand} on hand)
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
                                        setPackageDraftItems((prev) =>
                                          prev.map((x) =>
                                            x.id === it.id
                                              ? { ...x, qty: Math.max(0, Number(e.target.value) || 0) }
                                              : x,
                                          ),
                                        )
                                      }
                                    />
                                  </td>
                                  <td style={{ width: 150 }}>
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={it.unitPrice}
                                      onChange={(e) =>
                                        setPackageDraftItems((prev) =>
                                          prev.map((x) =>
                                            x.id === it.id
                                              ? { ...x, unitPrice: Math.max(0, Number(e.target.value) || 0) }
                                              : x,
                                          ),
                                        )
                                      }
                                    />
                                  </td>
                                  <td style={{ width: 60 }}>
                                    <Button
                                      type="button"
                                      onClick={() =>
                                        setPackageDraftItems((prev) => prev.filter((x) => x.id !== it.id))
                                      }
                                    >
                                      X
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="row" style={{ justifyContent: 'flex-end' }}>
                          <Button
                            type="button"
                            onClick={() =>
                              setPackageDraftItems((prev) => [
                                ...prev,
                                {
                                  id: `dpi_${crypto.randomUUID()}`,
                                  itemNo: `PKG-EXTRA-${String(prev.length + 1).padStart(3, '0')}`,
                                  description: '',
                                  qty: 1,
                                  unitPrice: 0,
                                  kind: 'Material',
                                  inventoryItemId: '',
                                },
                              ])
                            }
                          >
                            Add Manual Item
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="row">
                    <div className="label">Line items</div>
                    <div className="spacer" />
                    <Button
                      type="button"
                      onClick={() =>
                        append({
                          id: `item_${crypto.randomUUID()}`,
                          invoiceId,
                          qty: 1,
                          itemNo: 'NEW',
                          description: 'New item',
                          unitPrice: 0,
                        })
                      }
                    >
                      Add Item
                    </Button>
                  </div>

                  <div className="tableWrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Qty</th>
                          <th>Item #</th>
                          <th>Description</th>
                          <th>Unit price</th>
                          <th>Line total</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {(items ?? []).map((itemRow, idx) => {
                          if (itemRow.description.trim().startsWith('[PKGCOMP-')) return null
                          const f = fields[idx]
                          if (!f) return null
                          const qty = watch(`items.${idx}.qty`) ?? 0
                          const unitPrice = watch(`items.${idx}.unitPrice`) ?? 0
                          return (
                            <tr key={f.id}>
                              <td style={{ width: 90 }}>
                                <Input
                                  type="number"
                                  min={0}
                                  step={1}
                                  {...register(`items.${idx}.qty`, { valueAsNumber: true })}
                                />
                              </td>
                              <td style={{ width: 170 }}>
                                <Input {...register(`items.${idx}.itemNo`)} />
                              </td>
                              <td>
                                <Input {...register(`items.${idx}.description`)} />
                              </td>
                              <td style={{ width: 200 }}>
                                <Controller
                                  control={control}
                                  name={`items.${idx}.unitPrice`}
                                  render={({ field }) => (
                                    <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
                                  )}
                                />
                              </td>
                              <td style={{ width: 170, fontWeight: 900 }}>
                                {money.fmt(qty * unitPrice)}
                              </td>
                              <td style={{ width: 60 }}>
                                <Button type="button" onClick={() => remove(idx)}>
                                  X
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <div className="muted">Order Total:</div>
                    <div style={{ fontWeight: 900 }}>{money.fmt(totals.orderTotal)}</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="cardBody" style={{ display: 'grid', gap: 14 }}>
                  <div className="label">Payment schedule</div>
                  <div className="grid2">
                    <div className="field">
                      <div className="label">Down Payment</div>
                      <Controller
                        control={control}
                        name="schedule.downPayment"
                        render={({ field }) => (
                          <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
                        )}
                      />
                    </div>
                    <div className="field">
                      <div className="label">Second Payment</div>
                      <Controller
                        control={control}
                        name="schedule.secondPayment"
                        render={({ field }) => (
                          <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
                        )}
                      />
                    </div>
                    <div className="field">
                      <div className="label">Third Payment</div>
                      <Controller
                        control={control}
                        name="schedule.thirdPayment"
                        render={({ field }) => (
                          <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
                        )}
                      />
                    </div>
                    <div className="field">
                      <div className="label">Final Payment</div>
                      <Controller
                        control={control}
                        name="schedule.finalPayment"
                        render={({ field }) => (
                          <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
                        )}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="muted">Schedule sum:</div>
                    <div style={{ fontWeight: 900 }}>{money.fmt(totals.paySum)}</div>
                    <div className="spacer" />
                    <div className="muted">Must equal Sub Total:</div>
                    <div style={{ fontWeight: 900 }}>{money.fmt(totals.subtotal)}</div>
                  </div>
                </div>
              </Card>

              {Object.keys(formState.errors).length ? (
                <div className="help">Fix validation errors before saving.</div>
              ) : null}
              </form>
            </div>
          </CardBody>
        </Card>

        <div>
          <Card>
            <CardHeader title="Preview (Letter)" subtitle="Printable document-style preview" />
            <CardBody>
              {inv && items && schedule && client ? (
                <InvoicePreview invoice={inv} items={items} schedule={schedule} client={client} />
              ) : (
                <div className="help">Loading preview...</div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
