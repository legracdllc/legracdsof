import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  employeeMe,
  getWorkOrder,
  getProject,
  listInventoryItems,
  saveWorkOrder,
  type Project,
  type InventoryItem,
  type WorkOrder,
} from '../api/client'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { FileUploadMock, type UploadMockFile } from '../components/ui/FileUploadMock'

export function EmployeeWorkOrderDetailPage() {
  const nav = useNavigate()
  const { workOrderId } = useParams()
  const [wo, setWo] = useState<WorkOrder | null>(null)
  const [note, setNote] = useState('')
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [reqType, setReqType] = useState<'Material' | 'Tool'>('Material')
  const [reqItemId, setReqItemId] = useState('')
  const [reqQty, setReqQty] = useState(1)
  const [reqNeededBy, setReqNeededBy] = useState('')
  const [reqNotes, setReqNotes] = useState('')
  const [project, setProject] = useState<Project | null>(null)
  const [section, setSection] = useState<'overview' | 'tasks' | 'requests' | 'media'>('overview')
  const [brokenMediaIds, setBrokenMediaIds] = useState<string[]>([])

  function compact(v: string) {
    return String(v ?? '').trim().toLowerCase().replace(/\s+/g, '')
  }

  function isAssignedToMe(order: WorkOrder, me: { id: string; name?: string; username?: string; phone?: string; email?: string }) {
    const assigned = (order.assignedTo ?? []).map((x) => compact(String(x)))
    const candidates = [me.id, me.name ?? '', me.username ?? '', me.phone ?? '', me.email ?? '']
      .map((x) => compact(String(x)))
      .filter(Boolean)
    return candidates.some((x) => assigned.includes(x))
  }

  useEffect(() => {
    let alive = true
    async function load() {
      const me = await employeeMe()
      if (!alive) return
      if (!me) {
        nav('/employee/login')
        return
      }
      if (!workOrderId) return
      const order = await getWorkOrder(workOrderId)
      if (!alive) return
      if (!order || !isAssignedToMe(order, me)) {
        nav('/employee/workorders')
        return
      }
      setWo(order)
      const proj = await getProject(order.projectId).catch(() => null)
      if (!alive) return
      setProject(proj)
      const inv = await listInventoryItems().catch(() => [] as InventoryItem[])
      if (!alive) return
      setInventory(inv)
    }
    load()
    return () => {
      alive = false
    }
  }, [workOrderId, nav])

  const inventoryOptions = useMemo(() => {
    return inventory
      .filter((it) => !it.archivedAt && it.type === reqType)
      .slice()
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  }, [inventory, reqType])

  if (!workOrderId) return null

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Card>
        <CardHeader
          title={wo?.title ?? 'Work Order'}
          subtitle="Simple employee view"
          right={
            <div className="row" style={{ gap: 10 }}>
              <Button type="button" onClick={() => nav('/employee/workorders')}>
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
            </div>
          }
        />
        <CardBody>
          {wo ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="segGroup employeeWoSegGroup" role="tablist" aria-label="Work order sections">
                <button type="button" className={`segBtn ${section === 'overview' ? 'segBtnActive' : ''}`} onClick={() => setSection('overview')}>Overview</button>
                <button type="button" className={`segBtn ${section === 'tasks' ? 'segBtnActive' : ''}`} onClick={() => setSection('tasks')}>Tasks</button>
                <button type="button" className={`segBtn ${section === 'requests' ? 'segBtnActive' : ''}`} onClick={() => setSection('requests')}>Requests</button>
                <button type="button" className={`segBtn ${section === 'media' ? 'segBtnActive' : ''}`} onClick={() => setSection('media')}>Media</button>
              </div>
              {section === 'overview' ? (
                <div className="grid2">
                  <div className="field">
                    <div className="label">Project</div>
                    <Input value={project?.name ?? wo.projectId} disabled />
                  </div>
                  <div className="field">
                    <div className="label">Job Address</div>
                    <Input value={project?.jobAddress ?? '-'} disabled />
                  </div>
                  <div className="field">
                    <div className="label">Status</div>
                    <Select
                      value={wo.status}
                      onChange={(e) => setWo({ ...wo, status: e.target.value as WorkOrder['status'] })}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Done">Done</option>
                    </Select>
                  </div>
                  <div className="field">
                    <div className="label">Priority</div>
                    <Input value={wo.priority} disabled />
                  </div>
                  <div className="field">
                    <div className="label">Start</div>
                    <Input value={wo.startDate} disabled />
                  </div>
                  <div className="field">
                    <div className="label">End</div>
                    <Input value={wo.endDate} disabled />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="help">Loading...</div>
          )}
        </CardBody>
      </Card>

      {section === 'tasks' ? (
        <Card>
          <CardHeader title="Tasks" subtitle="Check each task when finished" />
          <CardBody>
            {wo ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {wo.checklist.map((c) => (
                  <label
                    key={c.id}
                    className="row"
                    style={{
                      border: '1px solid var(--c-border)',
                      borderRadius: '14px',
                      padding: '10px 12px',
                      background: c.done ? 'rgba(220, 175, 54, 0.12)' : 'rgba(255,255,255,0.8)',
                    }}
                  >
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
                    <span style={{ fontWeight: 800 }}>{c.text}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="help">Loading...</div>
            )}
          </CardBody>
        </Card>
      ) : null}

      {section === 'tasks' ? (
        <Card>
          <CardHeader title="Scope of Work Draft" subtitle="Work instructions from admin" />
          <CardBody>
            {wo?.scopeDraft ? (
              <div style={{ display: 'grid', gap: 12 }}>
              <div className="help">
                Source: {wo.scopeDraft.source ?? 'local'} | Generated: {new Date(wo.scopeDraft.generatedAt).toLocaleString()}
              </div>
              <div className="card" style={{ padding: 12 }}>
                <div className="label" style={{ marginBottom: 8 }}>
                  Title
                </div>
                <div style={{ fontWeight: 800 }}>{wo.scopeDraft.title}</div>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <div className="label" style={{ marginBottom: 8 }}>
                  Tasks
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {wo.scopeDraft.tasks.map((t, i) => (
                    <div key={`${t}_${i}`} className="help">
                      {i + 1}. {t}
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <div className="label" style={{ marginBottom: 8 }}>
                  Process (Espanol)
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {wo.scopeDraft.processEs.map((p, i) => (
                    <div key={`${p}_${i}`} className="help">
                      {i + 1}. {p}
                    </div>
                  ))}
                </div>
              </div>
              </div>
            ) : (
              <div className="help">No scope draft generated yet.</div>
            )}
          </CardBody>
        </Card>
      ) : null}

      {section === 'requests' ? (
        <div className="grid2">
          <Card>
            <CardHeader title="Requests" subtitle="Ask for materials/tools" />
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
                          {it.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="field">
                    <div className="label">Qty</div>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={reqQty}
                      onChange={(e) => setReqQty(Number(e.target.value) || 1)}
                    />
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
            <CardHeader title="Notes" subtitle="Simple notes" />
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
                        <div className="help">{new Date(n.at).toLocaleString()}</div>
                        <div style={{ marginTop: 6, fontWeight: 700 }}>{n.text}</div>
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
                      author: 'Employee',
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
        </div>
      ) : null}

      {section === 'media' ? (
        <Card>
          <CardHeader title="Media" subtitle="Upload and view shared media" />
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
                {wo.media.map((m) =>
                  brokenMediaIds.includes(m.id) || !m.previewUrl ? (
                    <div
                      key={m.id}
                      className="thumb"
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        padding: 6,
                        background: 'rgba(14, 28, 40, 0.04)',
                        textAlign: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--c-muted)',
                      }}
                    >
                      {m.name || 'Media file'}
                    </div>
                  ) : (
                    <img
                      key={m.id}
                      className="thumb"
                      src={m.previewUrl}
                      alt={m.name}
                      onError={() => setBrokenMediaIds((prev) => (prev.includes(m.id) ? prev : [...prev, m.id]))}
                    />
                  ),
                )}
              </div>
              <div className="help">
                If a file was uploaded from another device, preview may be unavailable in mock mode.
              </div>
            </div>
          ) : (
            <div className="help">Loading...</div>
          )}
          </CardBody>
        </Card>
      ) : null}
    </div>
  )
}
