import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  addProjectMaterial,
  getLedger,
  getProject,
  listInvoices,
  listLaborEntries,
  listProjectMaterials,
  saveLedger,
  syncProjectMaterialsFromLatestEstimate,
  updateProjectMaterial,
  addLaborEntry,
  deleteLaborEntry,
  updateLaborEntry,
  type Invoice,
  type LaborEntry,
  type LedgerDoc,
  type Project,
  type ProjectMaterial,
} from '../api/client'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SpreadsheetGrid } from '../components/ledger/SpreadsheetGrid'
import { MoneyInput, money } from '../components/ui/MoneyInput'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'

function headerValue(label: string, value: string) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="label">{label}</div>
      <div style={{ fontWeight: 900, marginTop: 6 }}>{value}</div>
    </div>
  )
}

export function LedgerPage() {
  const { projectId } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [doc, setDoc] = useState<LedgerDoc | null>(null)
  const [materials, setMaterials] = useState<ProjectMaterial[]>([])
  const [labor, setLabor] = useState<LaborEntry[]>([])
  const [estimate, setEstimate] = useState<Invoice | null>(null)

  const [labDate, setLabDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [labProcess, setLabProcess] = useState('')
  const [labHours, setLabHours] = useState(8)
  const [labRate, setLabRate] = useState(0)
  const [matName, setMatName] = useState('')
  const [matSku, setMatSku] = useState('')
  const [matQty, setMatQty] = useState(1)
  const [matUnitCost, setMatUnitCost] = useState(0)

  useEffect(() => {
    if (!projectId) return
    getProject(projectId).then(setProject)
    getLedger(projectId).then((d) => {
      if (d) setDoc(d)
      else {
        setDoc({
          projectId,
          homeDepotLowes: [],
          amazon: [],
          subContractor: [],
        })
      }
    })
  }, [projectId])

  async function refreshFinancials() {
    if (!projectId) return
    const [m, l, invs] = await Promise.all([
      listProjectMaterials(projectId).catch(() => [] as ProjectMaterial[]),
      listLaborEntries(projectId).catch(() => [] as LaborEntry[]),
      listInvoices(projectId).catch(() => [] as Invoice[]),
    ])
    setMaterials(m)
    setLabor(l)
    const estimates = invs.filter((i) => i.type === 'Estimate')
    const pick =
      estimates
        .slice()
        .sort((a, b) => String(a.invoiceNo).localeCompare(String(b.invoiceNo)))
        .at(-1) ?? null
    setEstimate(pick)
  }

  useEffect(() => {
    refreshFinancials()
  }, [projectId])

  const headerCards = useMemo(() => {
    return (
      <div className="grid2 ledgerSummaryGrid">
        {headerValue('JOB NAME', project?.name ?? '-')}
        {headerValue('APPT DATE', project?.apptDate ?? '-')}
        {headerValue('JOB PHONE', project?.jobPhone ?? '-')}
        {headerValue('Revenue', money.fmt(project?.revenue ?? 0))}
        {headerValue('Budget', money.fmt(project?.budgetTotal ?? 0))}
        {headerValue('Costumer Paid', money.fmt(project?.customerPaid ?? 0))}
        {headerValue('REMINDER', project?.reminder ?? '-')}
      </div>
    )
  }, [project])

  const spend = useMemo(() => {
    const materialsSpent = materials.reduce((sum, m) => {
      if (!m.purchased) return sum
      const unit = m.purchasedCost ?? 0
      return sum + (m.qty ?? 0) * unit
    }, 0)
    const laborSpent = labor.reduce((sum, x) => sum + (x.hours ?? 0) * (x.rate ?? 0), 0)
    const total = materialsSpent + laborSpent
    const remaining = (project?.budgetTotal ?? 0) - total
    return { materialsSpent, laborSpent, total, remaining }
  }, [materials, labor, project?.budgetTotal])

  if (!projectId) return null

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Card>
        <CardHeader
          title="Project Financials"
          subtitle="Spreadsheet-style grid "
          right={
            <Button
              type="button"
              variant="primary"
              onClick={async () => {
                if (!doc) return
                await saveLedger(doc)
              }}
              disabled={!doc}
            >
              Save 
            </Button>
          }
        />
        <CardBody>{headerCards}</CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Materials & Labor"
          subtitle="Phase 4 tracking "
          right={
            <div className="row" style={{ gap: 10 }}>
              <Button
                type="button"
                variant="primary"
                disabled={!projectId || !estimate}
                onClick={async () => {
                  if (!projectId) return
                  await syncProjectMaterialsFromLatestEstimate(projectId)
                  await refreshFinancials()
                }}
              >
                Sync From Quote
              </Button>
              <Button type="button" onClick={refreshFinancials}>
                Refresh
              </Button>
            </div>
          }
        />
        <CardBody>
          {estimate?.clientApprovedAt ? null : (
            <div className="bannerDanger">
              Quote not approved yet. Phase 4 is informational only .
            </div>
          )}

          <div className="grid2 ledgerSummaryGrid" style={{ marginTop: 12 }}>
            {headerValue('Materials Spent', money.fmt(spend.materialsSpent))}
            {headerValue('Labor Spent', money.fmt(spend.laborSpent))}
            {headerValue('Total Spent', money.fmt(spend.total))}
            {headerValue('Remaining Budget', money.fmt(spend.remaining))}
          </div>
        </CardBody>
      </Card>

      <div className="grid2">
        <Card>
          <CardHeader
            title="Materials"
            subtitle="From quote + purchase tracking"
            right={estimate ? <Badge tone="navy">Estimate #{estimate.invoiceNo}</Badge> : <Badge tone="navy">No quote</Badge>}
          />
          <CardBody>
            <div className="card" style={{ padding: 12, marginBottom: 12 }}>
              <div className="label">Add Material</div>
              <div className="grid2" style={{ marginTop: 8 }}>
                <div className="field">
                  <div className="label">Name</div>
                  <Input value={matName} onChange={(e) => setMatName(e.target.value)} placeholder="Material name" />
                </div>
                <div className="field">
                  <div className="label">SKU</div>
                  <Input value={matSku} onChange={(e) => setMatSku(e.target.value)} placeholder="SKU" />
                </div>
                <div className="field">
                  <div className="label">Qty</div>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={matQty}
                    onChange={(e) => setMatQty(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
                <div className="field">
                  <div className="label">Est Unit Cost</div>
                  <MoneyInput value={matUnitCost} onChange={setMatUnitCost} />
                </div>
              </div>
              <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
                <Button
                  type="button"
                  variant="primary"
                  disabled={!projectId || !matName.trim()}
                  onClick={async () => {
                    if (!projectId || !matName.trim()) return
                    await addProjectMaterial({
                      projectId,
                      name: matName.trim(),
                      sku: matSku.trim(),
                      qty: matQty,
                      unitCostEstimate: matUnitCost,
                    })
                    setMatName('')
                    setMatSku('')
                    setMatQty(1)
                    setMatUnitCost(0)
                    await refreshFinancials()
                  }}
                >
                  Add Material
                </Button>
              </div>
            </div>

            {materials.length ? (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>SKU</th>
                      <th>Qty</th>
                      <th>Est Unit</th>
                      <th>Purchased</th>
                      <th>Actual Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m) => (
                      <tr key={m.id}>
                        <td style={{ minWidth: 220 }}>
                          <Input
                            value={m.name}
                            onChange={async (e) => {
                              const next: ProjectMaterial = { ...m, name: e.target.value }
                              await updateProjectMaterial(next)
                              await refreshFinancials()
                            }}
                          />
                        </td>
                        <td style={{ minWidth: 160 }}>
                          <Input
                            value={m.sku ?? ''}
                            onChange={async (e) => {
                              const next: ProjectMaterial = { ...m, sku: e.target.value }
                              await updateProjectMaterial(next)
                              await refreshFinancials()
                            }}
                          />
                        </td>
                        <td style={{ width: 110 }}>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={m.qty}
                            onChange={async (e) => {
                              const next: ProjectMaterial = {
                                ...m,
                                qty: Math.max(0, Number(e.target.value) || 0),
                              }
                              await updateProjectMaterial(next)
                              await refreshFinancials()
                            }}
                          />
                        </td>
                        <td style={{ width: 180 }}>
                          <MoneyInput
                            value={m.unitCostEstimate ?? 0}
                            onChange={async (n) => {
                              const next: ProjectMaterial = { ...m, unitCostEstimate: n }
                              await updateProjectMaterial(next)
                              await refreshFinancials()
                            }}
                          />
                        </td>
                        <td style={{ width: 120 }}>
                          <input
                            type="checkbox"
                            checked={m.purchased}
                            onChange={async () => {
                              const next: ProjectMaterial = {
                                ...m,
                                purchased: !m.purchased,
                                purchasedAt: !m.purchased ? new Date().toISOString() : null,
                              }
                              await updateProjectMaterial(next)
                              await refreshFinancials()
                            }}
                          />
                        </td>
                        <td style={{ width: 200 }}>
                          <MoneyInput
                            value={m.purchasedCost ?? 0}
                            onChange={async (n) => {
                              const next: ProjectMaterial = { ...m, purchasedCost: n }
                              await updateProjectMaterial(next)
                              await refreshFinancials()
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="help">
                No materials yet. Click <b>Sync From Quote</b> to import from the latest estimate.
              </div>
            )}
            <div className="help" style={{ marginTop: 10 }}>
              TODO: When materials are purchased, generate inventory movements and deduct by vendor.
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Labor" subtitle="Track hours and rate by process" />
          <CardBody>
            <div className="grid2">
              <div className="field">
                <div className="label">Date</div>
                <Input type="date" value={labDate} onChange={(e) => setLabDate(e.target.value)} />
              </div>
              <div className="field">
                <div className="label">Process</div>
                <Input value={labProcess} onChange={(e) => setLabProcess(e.target.value)} placeholder="e.g. Framing" />
              </div>
              <div className="field">
                <div className="label">Hours</div>
                <Input type="number" min={0} step="0.25" value={labHours} onChange={(e) => setLabHours(Number(e.target.value) || 0)} />
              </div>
              <div className="field">
                <div className="label">Rate (USD/hr)</div>
                <MoneyInput value={labRate} onChange={setLabRate} />
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
              <Button
                type="button"
                variant="primary"
                disabled={!labProcess.trim() || !projectId}
                onClick={async () => {
                  if (!projectId) return
                  await addLaborEntry({
                    projectId,
                    date: labDate,
                    process: labProcess.trim(),
                    hours: labHours,
                    rate: labRate,
                    notes: '',
                  })
                  setLabProcess('')
                  setLabHours(8)
                  setLabRate(0)
                  await refreshFinancials()
                }}
              >
                Add Labor
              </Button>
            </div>

            {labor.length ? (
              <div className="tableWrap" style={{ marginTop: 12 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Process</th>
                      <th>Hours</th>
                      <th>Rate</th>
                      <th>Total</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {labor.map((x) => (
                      <tr key={x.id}>
                        <td style={{ minWidth: 160 }}>
                          <Input
                            type="date"
                            value={x.date}
                            onChange={async (e) => {
                              await updateLaborEntry({ ...x, date: e.target.value })
                              await refreshFinancials()
                            }}
                          />
                        </td>
                        <td style={{ minWidth: 220 }}>
                          <Input
                            value={x.process}
                            onChange={async (e) => {
                              await updateLaborEntry({ ...x, process: e.target.value })
                              await refreshFinancials()
                            }}
                          />
                        </td>
                        <td style={{ width: 110 }}>
                          <Input
                            type="number"
                            min={0}
                            step="0.25"
                            value={x.hours}
                            onChange={async (e) => {
                              await updateLaborEntry({
                                ...x,
                                hours: Math.max(0, Number(e.target.value) || 0),
                              })
                              await refreshFinancials()
                            }}
                          />
                        </td>
                        <td style={{ width: 180 }}>
                          <MoneyInput
                            value={x.rate}
                            onChange={async (n) => {
                              await updateLaborEntry({ ...x, rate: n })
                              await refreshFinancials()
                            }}
                          />
                        </td>
                        <td style={{ fontWeight: 900 }}>{money.fmt((x.hours ?? 0) * (x.rate ?? 0))}</td>
                        <td style={{ width: 110 }}>
                          <Button
                            type="button"
                            onClick={async () => {
                              await deleteLaborEntry(x.id)
                              await refreshFinancials()
                            }}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="help" style={{ marginTop: 12 }}>
                No labor entries yet.
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Spreadsheet" subtitle="Editable sections with automatic totals" />
        <CardBody>
          {doc ? (
            <SpreadsheetGrid doc={doc} onChange={setDoc} />
          ) : (
            <div className="help">Loading project financials...</div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
