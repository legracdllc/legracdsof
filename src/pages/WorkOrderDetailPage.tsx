import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  adjustInventoryQty,
  getWorkOrder,
  listEmployees,
  listInventoryItems,
  saveWorkOrder,
  type Employee,
  type InventoryItem,
  type WorkOrder,
} from '../api/client'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { FileUploadMock, type UploadMockFile } from '../components/ui/FileUploadMock'
import { Textarea } from '../components/ui/Textarea'

export function WorkOrderDetailPage() {
  const nav = useNavigate()
  const { projectId, workOrderId } = useParams()
  const [wo, setWo] = useState<WorkOrder | null>(null)
  const [note, setNote] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])

  const [reqType, setReqType] = useState<'Material' | 'Tool'>('Material')
  const [reqItemId, setReqItemId] = useState('')
  const [reqQty, setReqQty] = useState(1)
  const [reqNeededBy, setReqNeededBy] = useState('')
  const [reqNotes, setReqNotes] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiPreview, setAiPreview] = useState<string[]>([])
  const [aiProcessEs, setAiProcessEs] = useState<string[]>([])
  const [aiBusy, setAiBusy] = useState(false)
  const [aiInfo, setAiInfo] = useState<string | null>(null)
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null)
  const [editingChecklistText, setEditingChecklistText] = useState('')

  useEffect(() => {
    if (!workOrderId) return
    getWorkOrder(workOrderId).then(setWo)
  }, [workOrderId])

  useEffect(() => {
    listEmployees().then(setEmployees).catch(() => setEmployees([]))
    listInventoryItems().then(setInventory).catch(() => setInventory([]))
  }, [])

  const activeEmployees = useMemo(() => employees.filter((e) => !e.archivedAt && e.active), [employees])
  const assignedNames = useMemo(() => {
    const map = new Map(employees.map((e) => [e.id, e.name]))
    return (wo?.assignedTo ?? []).map((id) => map.get(id) ?? id)
  }, [employees, wo?.assignedTo])

  const inventoryOptions = useMemo(() => {
    return inventory
      .filter((it) => !it.archivedAt && it.type === reqType)
      .slice()
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  }, [inventory, reqType])

  function findInventoryIdByName(name: string): string | null {
    const hit = inventory.find((it) => (it.name ?? '').trim() === name.trim())
    return hit?.id ?? null
  }

  function escapeHtml(input: string): string {
    return input
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }

  function generateWorkOrderPdf(order: WorkOrder) {
    const assigned = assignedNames.length ? assignedNames.join(', ') : 'Unassigned'
    const checklistHtml = order.checklist
      .map((c) => `<li>${c.done ? '[x]' : '[ ]'} ${escapeHtml(c.text)}</li>`)
      .join('')
    const notesHtml = order.notes.length
      ? order.notes
          .slice(0, 20)
          .map(
            (n) =>
              `<li><b>${escapeHtml(n.author)}</b> - ${new Date(n.at).toLocaleString()}<br/>${escapeHtml(n.text)}</li>`,
          )
          .join('')
      : '<li>No notes</li>'
    const requestsHtml = (order.requests ?? []).length
      ? (order.requests ?? [])
          .map(
            (r) =>
              `<li>${escapeHtml(r.type)} - ${escapeHtml(r.itemName)} x${r.qty} (${escapeHtml(r.status)})</li>`,
          )
          .join('')
      : '<li>No requests</li>'

    const popup = window.open('', '_blank', 'width=1000,height=900')
    if (!popup) return

    popup.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Work Order ${escapeHtml(order.title)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
      h1 { margin: 0 0 8px 0; font-size: 24px; }
      h2 { margin: 20px 0 8px 0; font-size: 16px; }
      .meta { display: grid; grid-template-columns: 180px 1fr; gap: 6px 12px; font-size: 13px; }
      ul { margin: 8px 0 0 18px; padding: 0; }
      li { margin: 4px 0; }
      .muted { color: #666; }
    </style>
  </head>
  <body>
    <h1>Work Order</h1>
    <div class="meta">
      <div class="muted">Title</div><div>${escapeHtml(order.title)}</div>
      <div class="muted">Status</div><div>${escapeHtml(order.status)}</div>
      <div class="muted">Priority</div><div>${escapeHtml(order.priority)}</div>
      <div class="muted">Start</div><div>${escapeHtml(order.startDate)}</div>
      <div class="muted">End</div><div>${escapeHtml(order.endDate)}</div>
      <div class="muted">Assigned</div><div>${escapeHtml(assigned)}</div>
    </div>
    <h2>Checklist</h2>
    <ul>${checklistHtml}</ul>
    <h2>Requests</h2>
    <ul>${requestsHtml}</ul>
    <h2>Notes</h2>
    <ul>${notesHtml}</ul>
  </body>
</html>`)
    popup.document.close()
    popup.focus()
    popup.print()
  }

  function openWhatsAppTest(order: WorkOrder) {
    const assigned = assignedNames.length ? assignedNames.join(', ') : 'Unassigned'
    const done = order.checklist.filter((c) => c.done).length
    const total = order.checklist.length
    const message =
      `TEST MESSAGE - Work Order\n` +
      `Title: ${order.title}\n` +
      `Status: ${order.status}\n` +
      `Priority: ${order.priority}\n` +
      `Dates: ${order.startDate} to ${order.endDate}\n` +
      `Assigned: ${assigned}\n` +
      `Checklist: ${done}/${total} completed\n\n` +
      `PDF generated from system. Please attach PDF file in WhatsApp before sending.`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  function buildScopeFromPrompt(prompt: string) {
    const trimmed = prompt.trim()
    if (!trimmed) return null
    const raw = trimmed
      .split(/\n|,|;|\band\b/gi)
      .map((x) => x.trim())
      .filter((x) => x.length >= 3)
    const seen = new Set<string>()
    const tasks = raw.filter((t) => {
      const key = t.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    const finalTasks = tasks.length ? tasks : [trimmed]
    const checklist = finalTasks
      .flatMap((t) => [`Confirm materials/tools for ${t}`, `Execute ${t}`, `Quality check ${t}`])
      .slice(0, 18)
    const processEs = finalTasks
      .flatMap((t) => [
        `Analisis inicial de la tarea "${t}": revisar planos, medidas, restricciones del sitio y riesgos.`,
        `Preparacion para "${t}": validar herramientas, materiales, EPP, permisos y orden de ejecucion.`,
        `Ejecucion controlada de "${t}": realizar trabajo por etapas, registrar avances y resolver bloqueos.`,
        `Control de calidad de "${t}": verificar terminaciones, pruebas funcionales y cumplimiento de especificaciones.`,
        `Cierre de "${t}": limpieza del area, evidencia fotografica, notas tecnicas y estatus final.`,
      ])
      .slice(0, 25)
    const title = finalTasks.length === 1 ? `Scope: ${finalTasks[0]}` : `Scope: ${finalTasks.length} Tasks`
    return { title, tasks: finalTasks, checklist, processEs }
  }

  async function buildScopeWithApi(prompt: string) {
    const res = await fetch('/api/ai/scope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(String(err?.error ?? 'AI request failed'))
    }
    const data = (await res.json()) as {
      title: string
      tasks: string[]
      checklist: string[]
      processEs: string[]
      source?: string
    }
    return data
  }

  if (!projectId || !workOrderId) return null

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Card>
        <CardHeader
          title="Work Order"
          subtitle="Header + checklist + notes + media "
          right={
            <div className="row">
              <Button type="button" onClick={() => nav(`/projects/${projectId}/workorders`)}>
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!wo}
                onClick={async () => {
                  if (!wo) return
                  await saveWorkOrder(wo)
                }}
              >
                Save 
              </Button>
              <Button
                type="button"
                disabled={!wo}
                onClick={() => {
                  if (!wo) return
                  generateWorkOrderPdf(wo)
                }}
              >
                Generate PDF
              </Button>
              <Button
                type="button"
                disabled={!wo}
                onClick={() => {
                  if (!wo) return
                  openWhatsAppTest(wo)
                }}
              >
                WhatsApp Test
              </Button>
            </div>
          }
        />
        <CardBody>
          {wo ? (
            <div className="grid2">
              <div className="field">
                <div className="label">Title</div>
                <Input value={wo.title} onChange={(e) => setWo({ ...wo, title: e.target.value })} />
              </div>
              <div className="field">
                <div className="label">Priority</div>
                <Select
                  value={wo.priority}
                  onChange={(e) => setWo({ ...wo, priority: e.target.value as WorkOrder['priority'] })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Select>
              </div>
              <div className="field">
                <div className="label">Start date</div>
                <Input
                  type="date"
                  value={wo.startDate}
                  onChange={(e) => setWo({ ...wo, startDate: e.target.value })}
                />
              </div>
              <div className="field">
                <div className="label">End date</div>
                <Input
                  type="date"
                  value={wo.endDate}
                  onChange={(e) => setWo({ ...wo, endDate: e.target.value })}
                />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <div className="label">Assigned</div>
                <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                  <Select
                    value=""
                    onChange={(e) => {
                      const id = e.target.value
                      if (!id) return
                      setWo({ ...wo, assignedTo: Array.from(new Set([...(wo.assignedTo ?? []), id])) })
                    }}
                    style={{ width: 'min(320px, 100%)' }}
                  >
                    <option value="" disabled>
                      Add assignee...
                    </option>
                    {activeEmployees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.role})
                      </option>
                    ))}
                  </Select>
                  {assignedNames.length ? (
                    assignedNames.map((name, idx) => (
                      <span key={`${name}_${idx}`} className="badge badgeGold">
                        {name}
                        <button
                          type="button"
                          className="chipX"
                          aria-label={`Remove ${name}`}
                          onClick={() => {
                            const ids = wo.assignedTo ?? []
                            const idToRemove = ids[idx]
                            setWo({ ...wo, assignedTo: ids.filter((x) => x !== idToRemove) })
                          }}
                        >
                          x
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="help">No assignees.</span>
                  )}
                </div>
                <div className="help" style={{ marginTop: 8 }}>
                  TODO: contractor portal. For now, assignments are stored in work order.
                </div>
              </div>
            </div>
          ) : (
            <div className="help">Loading...</div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="AI Scope Tool"
          subtitle="Generate scope of work from one task or multiple tasks "
        />
        <CardBody>
          {wo ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="field">
                <div className="label">Task / Tasks</div>
                <Textarea
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Example: Install drywall in bedroom, paint ceiling, install baseboards"
                />
                <div className="help">Use commas, lines, or "and" to separate multiple tasks.</div>
              </div>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  onClick={async () => {
                    setAiInfo(null)
                    setAiBusy(true)
                    try {
                      const draft = await buildScopeWithApi(aiPrompt)
                      setAiPreview(draft.checklist ?? [])
                      setAiProcessEs(draft.processEs ?? [])
                      setAiInfo('Generado con OpenAI.')
                    } catch (e) {
                      const draft = buildScopeFromPrompt(aiPrompt)
                      setAiPreview(draft?.checklist ?? [])
                      setAiProcessEs(draft?.processEs ?? [])
                      setAiInfo(
                        `OpenAI no disponible (${e instanceof Error ? e.message : 'error'}). Se uso generador local.`,
                      )
                    } finally {
                      setAiBusy(false)
                    }
                  }}
                  disabled={!aiPrompt.trim() || aiBusy}
                >
                  Generate Draft
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={!aiPrompt.trim() || aiBusy}
                  onClick={async () => {
                    setAiInfo(null)
                    setAiBusy(true)
                    try {
                      let draft:
                        | { title: string; tasks: string[]; checklist: string[]; processEs: string[]; source?: string }
                        | null = null
                      try {
                        draft = await buildScopeWithApi(aiPrompt)
                        setAiInfo('Aplicado desde OpenAI.')
                      } catch (e) {
                        draft = buildScopeFromPrompt(aiPrompt)
                        setAiInfo(
                          `OpenAI no disponible (${e instanceof Error ? e.message : 'error'}). Se aplico generador local.`,
                        )
                      }
                      if (!draft) return
                      const nowIso = new Date().toISOString()
                      const updatedWo: WorkOrder = {
                        ...wo,
                        title: draft.title,
                        scopeDraft: {
                          generatedAt: nowIso,
                          source: draft.source ?? 'local',
                          title: draft.title,
                          tasks: draft.tasks,
                          checklist: draft.checklist,
                          processEs: draft.processEs,
                        },
                        checklist: draft.checklist.map((text) => ({
                          id: `c_${crypto.randomUUID()}`,
                          text,
                          done: false,
                        })),
                        notes: [
                          {
                            id: `n_${crypto.randomUUID()}`,
                            at: nowIso,
                            author: 'AI Tool',
                            text: `Scope generated for: ${draft.tasks.join(' | ')}`,
                          },
                          ...wo.notes,
                        ],
                      }
                      setWo(updatedWo)
                      await saveWorkOrder(updatedWo)
                      setAiPreview(draft.checklist)
                      setAiProcessEs(draft.processEs)
                    } finally {
                      setAiBusy(false)
                    }
                  }}
                >
                  Apply to Work Order
                </Button>
              </div>
              {aiInfo ? <div className="help">{aiInfo}</div> : null}
              {aiPreview.length ? (
                <div className="card" style={{ padding: 12 }}>
                  <div className="label" style={{ marginBottom: 8 }}>
                    Generated Scope Preview
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {aiPreview.map((x, idx) => (
                      <div key={`${x}_${idx}`} className="help">
                        {idx + 1}. {x}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {aiProcessEs.length ? (
                <div className="card" style={{ padding: 12 }}>
                  <div className="label" style={{ marginBottom: 8 }}>
                    Explicacion Detallada del Proceso (IA - Espanol)
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {aiProcessEs.map((x, idx) => (
                      <div key={`${x}_${idx}`} className="help">
                        {idx + 1}. {x}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="help">Loading...</div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Checklist" subtitle="Toggle, edit, or delete items" />
        <CardBody>
          {wo ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {wo.checklist.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'grid',
                    gap: 10,
                    border: '1px solid var(--c-border)',
                    borderRadius: '14px',
                    padding: '10px 12px',
                    background: c.done ? 'rgba(220, 175, 54, 0.12)' : 'rgba(255,255,255,0.8)',
                  }}
                >
                  <label className="row" style={{ gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={c.done}
                      onChange={() =>
                        setWo({
                          ...wo,
                          checklist: wo.checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)),
                        })
                      }
                    />
                    {editingChecklistId === c.id ? (
                      <Input
                        value={editingChecklistText}
                        onChange={(e) => setEditingChecklistText(e.target.value)}
                        placeholder="Checklist item..."
                      />
                    ) : (
                      <span style={{ fontWeight: 800 }}>{c.text}</span>
                    )}
                  </label>

                  <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                    {editingChecklistId === c.id ? (
                      <>
                        <Button
                          type="button"
                          variant="primary"
                          disabled={!editingChecklistText.trim()}
                          onClick={() => {
                            const nextText = editingChecklistText.trim()
                            if (!nextText) return
                            setWo({
                              ...wo,
                              checklist: wo.checklist.map((x) => (x.id === c.id ? { ...x, text: nextText } : x)),
                            })
                            setEditingChecklistId(null)
                            setEditingChecklistText('')
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setEditingChecklistId(null)
                            setEditingChecklistText('')
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          onClick={() => {
                            setEditingChecklistId(c.id)
                            setEditingChecklistText(c.text)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            const ok = window.confirm(`Delete checklist item "${c.text}"?`)
                            if (!ok) return
                            setWo({
                              ...wo,
                              checklist: wo.checklist.filter((x) => x.id !== c.id),
                            })
                            if (editingChecklistId === c.id) {
                              setEditingChecklistId(null)
                              setEditingChecklistText('')
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                onClick={() =>
                  setWo({
                    ...wo,
                    checklist: [
                      ...wo.checklist,
                      { id: `c_${crypto.randomUUID()}`, text: 'New checklist item', done: false },
                    ],
                  })
                }
              >
                Add item
              </Button>
            </div>
          ) : (
            <div className="help">Loading...</div>
          )}
        </CardBody>
      </Card>

      <div className="grid2">
        <Card>
          <CardHeader title="Notes" subtitle="Simple notes feed " />
          <CardBody>
            {wo ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  {wo.notes.length ? (
                    wo.notes.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          border: '1px solid var(--c-border)',
                          borderRadius: '14px',
                          padding: '12px',
                          background: 'rgba(255,255,255,0.85)',
                        }}
                      >
                        <div className="row">
                          <span className="badge badgeNavy">{n.author}</span>
                          <span className="help">{new Date(n.at).toLocaleString()}</span>
                        </div>
                        <div style={{ marginTop: 8, fontWeight: 700 }}>{n.text}</div>
                      </div>
                    ))
                  ) : (
                    <div className="help">No notes yet.</div>
                  )}
                </div>

                <div className="field">
                  <div className="label">Add note</div>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Type a note..." />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  disabled={!note.trim()}
                  onClick={() => {
                    const next = {
                      id: `n_${crypto.randomUUID()}`,
                      at: new Date().toISOString(),
                      author: 'Admin',
                      text: note.trim(),
                    }
                    setWo({ ...wo, notes: [next, ...wo.notes] })
                    setNote('')
                  }}
                >
                  Add note
                </Button>
              </div>
            ) : (
              <div className="help">Loading...</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Requests" subtitle="Request materials/tools " />
          <CardBody>
            {wo ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div className="grid2">
                  <div className="field">
                    <div className="label">Type</div>
                    <Select value={reqType} onChange={(e) => setReqType(e.target.value as any)}>
                      <option value="Material">Material</option>
                      <option value="Tool">Tool</option>
                    </Select>
                  </div>
                  <div className="field">
                    <div className="label">Item</div>
                    <Select value={reqItemId} onChange={(e) => setReqItemId(e.target.value)}>
                      <option value="">Select item...</option>
                      {inventoryOptions.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} (on hand: {it.qtyOnHand})
                        </option>
                      ))}
                    </Select>
                    <div className="help">TODO: allow free-text items if not in inventory.</div>
                  </div>
                  <div className="field">
                    <div className="label">Qty</div>
                    <Input type="number" min={1} step={1} value={reqQty} onChange={(e) => setReqQty(Number(e.target.value) || 1)} />
                  </div>
                  <div className="field">
                    <div className="label">Needed by</div>
                    <Input type="date" value={reqNeededBy} onChange={(e) => setReqNeededBy(e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <div className="label">Notes</div>
                  <Input value={reqNotes} onChange={(e) => setReqNotes(e.target.value)} placeholder="Optional..." />
                </div>
                <div className="row" style={{ justifyContent: 'flex-end' }}>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={!reqItemId}
                    onClick={() => {
                      const it = inventory.find((x) => x.id === reqItemId)
                      if (!it) return
                      const nextReq = {
                        id: `req_${crypto.randomUUID()}`,
                        type: reqType,
                        itemName: it.name,
                        qty: Math.max(1, Math.trunc(reqQty)),
                        neededBy: reqNeededBy || undefined,
                        status: 'Requested' as const,
                        notes: reqNotes.trim(),
                      }
                      setWo({ ...wo, requests: [nextReq, ...(wo.requests ?? [])] })
                      setReqItemId('')
                      setReqQty(1)
                      setReqNeededBy('')
                      setReqNotes('')
                    }}
                  >
                    Add Request
                  </Button>
                </div>

                {(wo.requests ?? []).length ? (
                  <div className="tableWrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Needed by</th>
                          <th>Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {(wo.requests ?? []).map((r) => (
                          <tr key={r.id}>
                            <td>{r.type}</td>
                            <td style={{ fontWeight: 800 }}>{r.itemName}</td>
                            <td>{r.qty}</td>
                            <td>{r.neededBy ?? '-'}</td>
                            <td>{r.status}</td>
                            <td style={{ width: 220 }}>
                              <div className="row" style={{ gap: 8 }}>
                                <Button
                                  type="button"
                                  onClick={() =>
                                    setWo({
                                      ...wo,
                                      requests: (wo.requests ?? []).map((x) =>
                                        x.id === r.id ? { ...x, status: 'Approved' as const } : x,
                                      ),
                                    })
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  type="button"
                                  onClick={async () => {
                                    const invId = findInventoryIdByName(r.itemName)
                                    if (invId) {
                                      // Decrement inventory on fulfill. If not enough stock, allow anyway  but don't go negative.
                                      await adjustInventoryQty(invId, -Math.max(0, Math.trunc(r.qty ?? 0)))
                                      const nextInv = await listInventoryItems().catch(() => [] as InventoryItem[])
                                      setInventory(nextInv)
                                    }
                                    setWo({
                                      ...wo,
                                      requests: (wo.requests ?? []).map((x) =>
                                        x.id === r.id ? { ...x, status: 'Fulfilled' as const } : x,
                                      ),
                                    })
                                  }}
                                >
                                  Fulfill
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="help">No requests yet.</div>
                )}
              </div>
            ) : (
              <div className="help">Loading...</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Media" subtitle="Upload media " />
          <CardBody>
            {wo ? (
              <div style={{ display: 'grid', gap: 14 }}>
                <FileUploadMock
                  onAdd={(files: UploadMockFile[]) => {
                    setWo({
                      ...wo,
                      media: [
                        ...files.map((f) => ({ id: f.id, name: f.name, previewUrl: f.previewUrl })),
                        ...wo.media,
                      ],
                    })
                  }}
                />
                <div className="thumbs">
                  {wo.media.map((m) => (
                    <img key={m.id} className="thumb" src={m.previewUrl} alt={m.name} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="help">Loading...</div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
