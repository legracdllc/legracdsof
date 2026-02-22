import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import {
  addProjectTimelineEvent,
  createEstimate,
  createWorkOrder,
  generateWeeklyWorkOrdersFromStartDate,
  getPaymentSchedule,
  getClient,
  getProject,
  getRetailSnapshots,
  listEmployees,
  listInvoices,
  replaceProjectTimeline,
  saveWorkOrder,
  setProjectTimelineStatus,
  type Client,
  type Employee,
  type Invoice,
  type PaymentSchedule,
  type Project,
  type ProjectTimelineEvent,
  type ProjectTimelineStatus,
} from '../api/client'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import { money } from '../components/ui/MoneyInput'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'

const timelineSchema = z.object({
  at: z.string().min(10),
  title: z.string().min(2),
  status: z.enum(['Planned', 'In Progress', 'Done', 'Blocked']),
  notes: z.string().optional(),
})

type TimelineFormValues = z.infer<typeof timelineSchema>

const phase2Subphases: Array<{ n: number; title: string }> = [
  { n: 4, title: 'Demolición y Drenaje Subterráneo' },
  { n: 5, title: 'Concreto / Forma' },
  { n: 6, title: 'Framing / Puertas / Ventanas' },
  { n: 7, title: 'Preeléctrica' },
  { n: 8, title: 'Drenaje y Ventilación' },
  { n: 9, title: 'Plomería Hidráulica' },
  { n: 10, title: 'Insulación' },
  { n: 11, title: 'Drywall' },
  { n: 12, title: 'Acabado Drywall' },
  { n: 13, title: 'Pintura' },
  { n: 14, title: 'Terminación Eléctrica' },
  { n: 15, title: 'Piso' },
  { n: 16, title: 'Gabinetes y Countertop' },
  { n: 17, title: 'Instalación Final Baño' },
  { n: 18, title: 'Puertas, Trims y Baseboard' },
  { n: 19, title: 'Hardware' },
  { n: 20, title: 'Retoques' },
]

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const nav = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [poItems, setPoItems] = useState<string[]>([])
  const [poColor, setPoColor] = useState<string>('')
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [estimate, setEstimate] = useState<Invoice | null>(null)
  const [estimateSchedule, setEstimateSchedule] = useState<PaymentSchedule | null>(null)
  const [openTimelineId, setOpenTimelineId] = useState<string | null>(null)
  const [showSystemEvents, setShowSystemEvents] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assigneeByStep, setAssigneeByStep] = useState<Record<string, string>>({})

  const workflowTemplate = useMemo(
    () => [
      {
        phase: 'PHASE 1 – PRE-CONSTRUCTION',
        steps: [
          { title: 'Information Collection', notes: 'Site visit, measurements, requirements, budget discussion.' },
          { title: 'Create Quote', notes: 'Scope breakdown, estimate, payment schedule, timeline draft.' },
          { title: 'Create Blueprints (2D + 3D)', notes: 'Layout design, revisions, final approval.' },
          { title: 'Send Quote for Approval', notes: 'Submit proposal, clarify scope and exclusions.' },
          { title: 'Collect Down Payment', notes: 'Payment Trigger #1. Materials ordering authorized.' },
          { title: 'Set Tentative Start Date', notes: 'Align crews and lead times. Start date confirmed.' },
        ],
      },
      {
        phase: 'PHASE 2 – EXECUTION',
        steps: phase2Subphases.map((s, idx) => ({
          title: `2.${idx + 1} - ${s.title}`,
          notes: `Phase reference ${s.n}. Complete previous subphase before continuing.`,
        })),
      },
      {
        phase: 'PHASE 3 – COMPLETION & QUALITY CONTROL',
        steps: [
          { title: 'Final Check (Quality Control)', notes: 'Punch list, systems test, finish inspection, walkthrough.' },
          { title: 'Collect Final Payment', notes: 'Payment Trigger #3. Warranty and closeout.' },
        ],
      },
    ],
    [],
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TimelineFormValues>({
    resolver: zodResolver(timelineSchema),
    defaultValues: {
      at: dayjs().format('YYYY-MM-DD'),
      title: '',
      status: 'Planned',
      notes: '',
    },
  })

  useEffect(() => {
    if (!projectId) return
    getProject(projectId).then(setProject)
  }, [projectId])

  useEffect(() => {
    let alive = true
    async function loadEstimate() {
      if (!projectId) return
      const invs = await listInvoices(projectId)
      const estimates = invs.filter((i) => i.type === 'Estimate')
      const pick =
        estimates
          .slice()
          .sort((a, b) => String(a.invoiceNo).localeCompare(String(b.invoiceNo)))
          .at(-1) ?? null
      if (!alive) return
      setEstimate(pick)
      if (pick) {
        const sch = await getPaymentSchedule(pick.id)
        if (!alive) return
        setEstimateSchedule(sch)
      } else {
        setEstimateSchedule(null)
      }
    }
    loadEstimate().catch(() => {
      if (!alive) return
      setEstimate(null)
      setEstimateSchedule(null)
    })
    return () => {
      alive = false
    }
  }, [projectId])

  useEffect(() => {
    if (!project?.clientId) return
    getClient(project.clientId).then(setClient)
  }, [project?.clientId])

  useEffect(() => {
    listEmployees().then(setEmployees).catch(() => setEmployees([]))
  }, [])

  useEffect(() => {
    if (!projectId) return
    getRetailSnapshots()
      .then((snap) => {
        const po = snap.purchaseOrders.find((p) => p.projectId === projectId)
        setPoItems(po?.items ?? [])
        setPoColor(po?.color ?? '')
      })
      .catch(() => {
        setPoItems([])
        setPoColor('')
      })
  }, [projectId])

  const quick = useMemo(() => {
    if (!projectId) return []
    const base = `/projects/${projectId}`
    return [
      { to: `${base}/invoices`, label: 'Invoices' },
      { to: `${base}/ledger`, label: 'Project Financials' },
      { to: `${base}/workorders`, label: 'Work Orders' },
    ]
  }, [projectId])

  const timeline = useMemo(() => {
    const list = (project?.timeline ?? []) as ProjectTimelineEvent[]
    const isSystemEvent = (title: string) =>
      /^quote (created|sent|approved)/i.test(title) ||
      /^deposit received/i.test(title) ||
      /^start date (proposed|approved)/i.test(title) ||
      /^project created$/i.test(title)
    const filtered = showSystemEvents ? list : list.filter((x) => !isSystemEvent(x.title))
    const sorted = [...filtered].sort((a, b) => a.at.localeCompare(b.at))
    return sorted
  }, [project, showSystemEvents])
  const progress = useMemo(() => {
    const total = timeline.length
    const done = timeline.filter((x) => x.status === 'Done').length
    const pct = total ? Math.round((done / total) * 100) : 0
    return { total, done, pct }
  }, [timeline])

  const workflowRows = useMemo(() => {
    const all = (project?.timeline ?? []) as ProjectTimelineEvent[]
    const findEvent = (stepTitle: string) => {
      const exact = all.find((ev) => ev.title.trim().toLowerCase() === stepTitle.trim().toLowerCase())
      if (exact) return exact
      return (
        all.find((ev) => ev.title.toLowerCase().includes(stepTitle.toLowerCase())) ??
        null
      )
    }
    return workflowTemplate.map((phase) => ({
      phase: phase.phase,
      steps: phase.steps.map((s) => ({
        ...s,
        event: findEvent(s.title),
      })),
    }))
  }, [project, workflowTemplate])

  const activeAssignable = useMemo(
    () => employees.filter((e) => !e.archivedAt && e.active),
    [employees],
  )

  const workflow = useMemo(() => {
    const now = dayjs().format('YYYY-MM-DD')
    const plansReady = Boolean((project?.measurements ?? '').trim()) || Boolean(project?.attachments?.length)
    const quoteCreated = Boolean(estimate)
    const quoteSent = Boolean(estimate?.sentAt) || estimate?.status === 'Sent'
    const quoteApproved = Boolean(estimate?.clientApprovedAt)
    const depositRequired = estimateSchedule?.downPayment ?? 0
    const depositReceived = (project?.depositAmount ?? 0) >= Math.max(0, depositRequired)
    const startProposed = Boolean(project?.startDateProposedAt) && Boolean(project?.startDateProposed)

    const step2Done = quoteCreated && plansReady
    const step3Done = depositReceived && quoteSent && startProposed
    const step4Done = quoteApproved && Boolean(project?.startDateApprovedAt)

    return {
      now,
      plansReady,
      quoteCreated,
      quoteSent,
      quoteApproved,
      depositRequired,
      depositReceived,
      startProposed,
      step2Done,
      step3Done,
      step4Done,
    }
  }, [project, estimate, estimateSchedule])

  function toneForStatus(s: ProjectTimelineStatus) {
    return s === 'Done' ? 'gold' : 'navy'
  }

  if (!projectId) return null

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div id="initial">
      <Card>
        <CardHeader
          title={project?.name ?? 'Project'}
          subtitle={client ? `Client: ${client.name}` : 'Loading client...'}
          right={
            <div className="row" style={{ gap: 10 }}>
              <Button
                type="button"
                variant="primary"
                disabled={!projectId}
                onClick={async () => {
                  if (!projectId) return
                  const inv = await createEstimate(projectId)
                  nav(`/projects/${projectId}/invoices/${inv.id}`)
                }}
              >
                Create Quote
              </Button>
              {project ? <StatusBadge status={project.status} /> : null}
            </div>
          }
        />
        <CardBody>
          <div className="grid2">
            <Card className="">
              <div className="cardBody">
                <div className="label">Job Location</div>
                <div style={{ fontWeight: 800, marginTop: 6 }}>{project?.jobAddress ?? '-'}</div>
                <div className="help" style={{ marginTop: 6 }}>
                  Job phone: {project?.jobPhone ?? '-'}
                </div>
                <div className="help">Appt date: {project?.apptDate ?? '-'}</div>
              </div>
            </Card>

            <Card className="">
              <div className="cardBody">
                <div className="label">Budget Summary</div>
                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  <div className="row">
                    <div className="muted">Revenue</div>
                    <div className="spacer" />
                    <div style={{ fontWeight: 900 }}>{money.fmt(project?.revenue ?? 0)}</div>
                  </div>
                  <div className="row">
                    <div className="muted">Budget</div>
                    <div className="spacer" />
                    <div style={{ fontWeight: 900 }}>{money.fmt(project?.budgetTotal ?? 0)}</div>
                  </div>
                  <div className="row">
                    <div className="muted">Customer paid</div>
                    <div className="spacer" />
                    <div style={{ fontWeight: 900 }}>{money.fmt(project?.customerPaid ?? 0)}</div>
                  </div>
                </div>
                {project?.reminder ? (
                  <div style={{ marginTop: 12 }} className="bannerDanger">
                    Reminder: {project.reminder}
                  </div>
                ) : null}
              </div>
            </Card>
          </div>

          <div className="row" style={{ marginTop: 18 }}>
            {quick.map((q) => (
              <Link key={q.to} to={q.to}>
                <Button type="button" variant="primary">
                  {q.label}
                </Button>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
      </div>

      <Card>
        <CardHeader title="Workflow Timeline" subtitle="Track each step by phase and update status manually." />
        <CardBody>
          <div style={{ display: 'grid', gap: 14 }}>
            {workflowRows.map((group) => (
              <div key={group.phase} className="card" style={{ padding: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>{group.phase}</div>
                <div className="tableWrap workflowTimelineTable">
                  <table>
                    <thead>
                      <tr>
                        <th>Done</th>
                        <th>Step</th>
                        <th>Status</th>
                        <th>Description</th>
                        <th>Date</th>
                        <th>Assign</th>
                        <th>Work Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.steps.map((row, stepIndex) => {
                        const previous = stepIndex > 0 ? group.steps[stepIndex - 1] : null
                        const isPhase2 = group.phase.toLowerCase().includes('phase 2')
                        const isLocked =
                          isPhase2 &&
                          stepIndex > 0 &&
                          previous?.event?.status !== 'Done' &&
                          row.event?.status !== 'Done'
                        const rowKey = `${group.phase}-${row.title}`
                        const selectedAssignee = assigneeByStep[rowKey] ?? ''

                        return (
                        <tr key={`${group.phase}-${row.title}`}>
                          <td style={{ width: 80 }}>
                            <input
                              type="checkbox"
                              disabled={isLocked}
                              checked={row.event?.status === 'Done'}
                              onChange={async (e) => {
                                if (!projectId) return
                                if (isLocked) return
                                if (!row.event) {
                                  await addProjectTimelineEvent(projectId, {
                                    at: dayjs().format('YYYY-MM-DD'),
                                    title: row.title,
                                    status: e.target.checked ? 'Done' : 'Planned',
                                    notes: row.notes,
                                  })
                                } else {
                                  await setProjectTimelineStatus(
                                    projectId,
                                    row.event.id,
                                    e.target.checked ? 'Done' : 'Planned',
                                  )
                                }
                                const p = await getProject(projectId)
                                setProject(p)
                              }}
                            />
                          </td>
                          <td style={{ fontWeight: 800 }}>{row.title}</td>
                          <td style={{ width: 180 }}>
                            <Select
                              disabled={isLocked}
                              value={row.event?.status ?? 'Planned'}
                              onChange={async (e) => {
                                const next = e.target.value as ProjectTimelineStatus
                                if (!projectId) return
                                if (isLocked) return
                                if (!row.event) {
                                  await addProjectTimelineEvent(projectId, {
                                    at: dayjs().format('YYYY-MM-DD'),
                                    title: row.title,
                                    status: next,
                                    notes: row.notes,
                                  })
                                } else {
                                  await setProjectTimelineStatus(projectId, row.event.id, next)
                                }
                                const p = await getProject(projectId)
                                setProject(p)
                              }}
                            >
                              <option value="Planned">Planned</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Blocked">Blocked</option>
                              <option value="Done">Done</option>
                            </Select>
                          </td>
                          <td className="help">{row.notes}</td>
                          <td style={{ width: 150 }} className="help">
                            {row.event ? dayjs(row.event.at).format('MMM D, YYYY') : isLocked ? 'Locked' : '-'}
                          </td>
                          <td style={{ width: 220 }}>
                            {isPhase2 ? (
                              <Select
                                value={selectedAssignee}
                                onChange={(e) =>
                                  setAssigneeByStep((prev) => ({
                                    ...prev,
                                    [rowKey]: e.target.value,
                                  }))
                                }
                              >
                                <option value="">Assign employee / subcontractor...</option>
                                {activeAssignable.map((emp) => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.name} ({emp.role})
                                  </option>
                                ))}
                              </Select>
                            ) : (
                              <span className="help">-</span>
                            )}
                          </td>
                          <td style={{ width: 170 }}>
                            {isPhase2 ? (
                              <Button
                                type="button"
                                disabled={isLocked || !selectedAssignee || !projectId}
                                onClick={async () => {
                                  if (!projectId || !selectedAssignee || isLocked) return
                                  try {
                                    const wo = await createWorkOrder(projectId)
                                    await saveWorkOrder({
                                      ...wo,
                                      title: `Subphase Task: ${row.title}`,
                                      assignedTo: [selectedAssignee],
                                      checklist: [
                                        {
                                          id: `c_${crypto.randomUUID()}`,
                                          text: `Execute ${row.title}`,
                                          done: false,
                                        },
                                      ],
                                    })
                                    nav(`/projects/${projectId}/workorders/${wo.id}`)
                                  } catch (error) {
                                    window.alert(error instanceof Error ? error.message : 'Unable to create work order.')
                                  }
                                }}
                              >
                                Create WO
                              </Button>
                            ) : (
                              <span className="help">-</span>
                            )}
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Project Workflow" subtitle="Phase chart " />
        <CardBody>
          <div className="wfWrap">
            <div className="wfSteps">
              <div className={`wfStep wfStepDone`.trim()}>
                <div className="wfDot" />
                <div className="wfTitle">1. Initial Info</div>
                <div className="wfMeta">
                  <div>Project created</div>
                  <div>Measurements, notes, media</div>
                </div>
                <div className="wfActions">
                  <Link to={`/projects/${projectId}`}>
                    <Button type="button">Open</Button>
                  </Link>
                </div>
              </div>

              <div
                className={`wfStep ${workflow.step2Done ? 'wfStepDone' : workflow.quoteCreated ? 'wfStepActive' : 'wfStepLocked'}`.trim()}
              >
                <div className="wfDot" />
                <div className="wfTitle">2. Quote + Plans</div>
                <div className="wfMeta">
                  <div>Quote: {workflow.quoteCreated ? `Estimate #${estimate?.invoiceNo}` : 'Not created'}</div>
                  <div>Plans: {workflow.plansReady ? 'Ready' : 'Missing'}</div>
                  <div className="help">TODO: AI quote drafting + real PDF generator.</div>
                </div>
                <div className="wfActions">
                  {estimate ? (
                    <Link to={`/projects/${projectId}/invoices/${estimate.id}`}>
                      <Button type="button">Open Quote</Button>
                    </Link>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={async () => {
                        const inv = await createEstimate(projectId)
                        nav(`/projects/${projectId}/invoices/${inv.id}`)
                      }}
                    >
                      Create Quote
                    </Button>
                  )}
                  <a href="#notes-files">
                    <Button type="button">Plans</Button>
                  </a>
                </div>
              </div>

              <div
                className={`wfStep ${workflow.step3Done ? 'wfStepDone' : workflow.quoteSent || workflow.depositReceived ? 'wfStepActive' : 'wfStepLocked'}`.trim()}
              >
                <div className="wfDot" />
                <div className="wfTitle">3. Deposit + Send + Start Date</div>
                <div className="wfMeta">
                  <div>Deposit required: {money.fmt(workflow.depositRequired)}</div>
                  <div>Deposit: {workflow.depositReceived ? 'OK' : 'Pending'}</div>
                  <div>Sent: {workflow.quoteSent ? 'Yes' : 'No'}</div>
                  <div>Start date: {workflow.startProposed ? project?.startDateProposed : 'Not proposed'}</div>
                  <div className="help">TODO: Email/WhatsApp sending + pre-contract template.</div>
                </div>
                <div className="wfActions">
                  {estimate ? (
                    <Link to={`/projects/${projectId}/invoices/${estimate.id}`}>
                      <Button type="button" variant="primary">
                        Open Send/Deposit
                      </Button>
                    </Link>
                  ) : (
                    <span className="help">Create quote first.</span>
                  )}
                </div>
              </div>

              <div
                className={`wfStep ${workflow.step4Done ? 'wfStepDone' : workflow.quoteApproved ? 'wfStepActive' : 'wfStepLocked'}`.trim()}
              >
                <div className="wfDot" />
                <div className="wfTitle">4. Approved + Execution</div>
                <div className="wfMeta">
                  <div>Approval: {workflow.quoteApproved ? 'Approved' : 'Awaiting'}</div>
                  <div>Financials + materials tracking</div>
                  <div>Weekly tasks + work orders</div>
                  <div className="help">TODO: material purchasing deducts budget; labor tracking; contractor portal.</div>
                </div>
                <div className="wfActions">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={async () => {
                      try {
                        const wo = await createWorkOrder(projectId)
                        nav(`/projects/${projectId}/workorders/${wo.id}`)
                      } catch (error) {
                        window.alert(error instanceof Error ? error.message : 'Unable to create work order.')
                      }
                    }}
                  >
                    Create Work Order
                  </Button>
                  <Link to={`/projects/${projectId}/ledger`}>
                    <Button type="button">Financials</Button>
                  </Link>
                  <Link to={`/projects/${projectId}/workorders`}>
                    <Button type="button" variant="primary">
                      Work Orders
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    disabled={!project?.startDateApprovedAt || !project?.startDateProposed}
                    onClick={async () => {
                      if (!projectId || !project?.startDateProposed) return
                      // Generate based on approved start date (uses the proposed date as the chosen start).
                      await generateWeeklyWorkOrdersFromStartDate(projectId, project.startDateProposed, 8)
                      nav(`/projects/${projectId}/workorders`)
                    }}
                  >
                    Generate Weekly Work Orders
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Execution Timeline"
          subtitle="Milestones and status updates "
          right={
            <div className="row" style={{ gap: 10 }}>
              <Button
                type="button"
                onClick={async () => {
                  if (!projectId || !project) return
                  const ok = window.confirm('Replace current timeline with your structured execution timeline?')
                  if (!ok) return

                  const start = dayjs(project.apptDate || dayjs().format('YYYY-MM-DD'))
                  const steps: Array<{
                    days: number
                    title: string
                    status: ProjectTimelineStatus
                    notes: string
                  }> = [
                    {
                      days: 0,
                      title: 'PHASE 1: Information Collection',
                      status: 'Planned',
                      notes: 'Site visit, measurements, client requirements, budget discussion.',
                    },
                    {
                      days: 2,
                      title: 'PHASE 1: Create Quote',
                      status: 'Planned',
                      notes: 'Scope breakdown, cost estimate, payment schedule, timeline draft.',
                    },
                    {
                      days: 4,
                      title: 'PHASE 1: Create Blueprints (2D + 3D)',
                      status: 'Planned',
                      notes: 'Layout design, optimization, revisions, final render approval.',
                    },
                    {
                      days: 6,
                      title: 'PHASE 1: Send Quote for Approval',
                      status: 'Planned',
                      notes: 'Submit proposal, clarify scope/exclusions. Milestone: Signed agreement.',
                    },
                    {
                      days: 8,
                      title: 'PHASE 1: Collect Down Payment',
                      status: 'Planned',
                      notes: 'Payment Trigger #1. Initial deposit received, materials ordering authorized.',
                    },
                    {
                      days: 10,
                      title: 'PHASE 1: Set Tentative Start Date',
                      status: 'Planned',
                      notes: 'Align crews, confirm lead times. Milestone: Start date confirmed.',
                    },
                    ...phase2Subphases.map((s, idx) => ({
                      days: 12 + idx,
                      title: `PHASE 2.${idx + 1}: ${s.title}`,
                      status: 'Planned' as ProjectTimelineStatus,
                      notes: `Document phase reference ${s.n}. Complete prior subphase to unlock this one.`,
                    })),
                    {
                      days: 30,
                      title: 'PHASE 3: Final Check (Quality Control)',
                      status: 'Planned',
                      notes: 'Punch list, systems test, finish inspection, client walkthrough.',
                    },
                    {
                      days: 32,
                      title: 'PHASE 3: Collect Final Payment',
                      status: 'Planned',
                      notes: 'Payment Trigger #3. Balance payment, warranty delivery, project closeout.',
                    },
                  ]

                  await replaceProjectTimeline(
                    projectId,
                    steps.map((s) => ({
                      at: start.add(s.days, 'day').format('YYYY-MM-DD'),
                      title: s.title,
                      status: s.status,
                      notes: s.notes,
                    })),
                  )

                  const p = await getProject(projectId)
                  setProject(p)
                }}
                disabled={!projectId || !project}
              >
                Generate Structured Timeline
              </Button>
              <Button type="button" onClick={() => setShowSystemEvents((v) => !v)}>
                {showSystemEvents ? 'Hide System Events' : 'Show System Events'}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  reset({
                    at: dayjs().format('YYYY-MM-DD'),
                    title: '',
                    status: 'Planned',
                    notes: '',
                  })
                  setTimelineOpen(true)
                }}
              >
                Add Milestone
              </Button>
            </div>
          }
        />
        <CardBody>
          <div className="card" style={{ padding: 12, marginBottom: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div className="label">Project Progress</div>
              <div style={{ fontWeight: 900 }}>{progress.pct}%</div>
            </div>
            <div style={{ marginTop: 8, height: 10, borderRadius: 999, background: 'rgba(229,231,235,1)' }}>
              <div
                style={{
                  width: `${progress.pct}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, var(--c-gold), var(--c-gold-accent))',
                }}
              />
            </div>
            <div className="help" style={{ marginTop: 8 }}>
              {progress.done} of {progress.total} milestones completed
            </div>
          </div>

          {timeline.length ? (
            <div className="timeline">
              {timeline.map((ev) => (
                <div key={ev.id} className="timelineRow">
                  <div className="timelineRail">
                    <div className="timelineDot" />
                  </div>
                  <div style={{ display: 'grid', gap: 8, width: '100%' }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setOpenTimelineId((id) => (id === ev.id ? null : ev.id))}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          margin: 0,
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontWeight: 900,
                          color: 'var(--c-text)',
                        }}
                      >
                        {ev.title}
                      </button>
                      <div className="row" style={{ gap: 8 }}>
                        <label className="help" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="checkbox"
                            checked={ev.status === 'Done'}
                            onChange={async (e) => {
                              const next: ProjectTimelineStatus = e.target.checked ? 'Done' : 'Planned'
                              await setProjectTimelineStatus(projectId, ev.id, next)
                              const p = await getProject(projectId)
                              setProject(p)
                            }}
                          />
                          Done
                        </label>
                        <span className="help">{dayjs(ev.at).format('MMM D, YYYY')}</span>
                        <Badge tone={toneForStatus(ev.status)}>{ev.status}</Badge>
                        <Select
                          value={ev.status}
                          onChange={async (e) => {
                            const next = e.target.value as ProjectTimelineStatus
                            await setProjectTimelineStatus(projectId, ev.id, next)
                            const p = await getProject(projectId)
                            setProject(p)
                          }}
                          style={{ width: 150 }}
                        >
                          <option value="Planned">Planned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Blocked">Blocked</option>
                          <option value="Done">Done</option>
                        </Select>
                      </div>
                    </div>
                    {openTimelineId === ev.id && ev.notes ? (
                      <div className="help" style={{ whiteSpace: 'pre-wrap' }}>
                        {ev.notes}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="help">No timeline items yet.</div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Purchase List (PO)"
          subtitle={poColor ? `Color: ${poColor}` : 'From provided PO list'}
        />
        <CardBody>
          {poItems.length ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {poItems.map((x) => (
                <div key={x} className="row">
                  <span className="badge badgeGold">{x}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="help">No PO items for this project.</div>
          )}
        </CardBody>
      </Card>

      <div id="notes-files">
      <Card>
        <CardHeader title="Notes & Files" subtitle="Captured during project creation " />
        <CardBody>
          {project?.notes ? (
            <div className="card" style={{ padding: 14 }}>
              <div className="label">Notes</div>
              <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{project.notes}</div>
            </div>
          ) : (
            <div className="help">No notes.</div>
          )}

          {project?.measurements ? (
            <div className="card" style={{ padding: 14, marginTop: 14 }}>
              <div className="label">Measurements</div>
              <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{project.measurements}</div>
              <div className="help" style={{ marginTop: 8 }}>
                TODO: structured measurements.
              </div>
            </div>
          ) : (
            <div className="help" style={{ marginTop: 14 }}>
              No measurements.
            </div>
          )}

          {project?.depositReceivedAt ? (
            project?.attachments?.length ? (
              <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                <div className="label">Attachments</div>
                <div className="row">
                  {project.attachments.slice(0, 10).map((a) => (
                    <span key={a.id} className={`badge ${a.kind === 'Measurement' ? 'badgeGold' : 'badgeNavy'}`}>
                      {a.kind}: {a.name}
                    </span>
                  ))}
                  {project.attachments.length > 10 ? (
                    <span className="help">+{project.attachments.length - 10} more</span>
                  ) : null}
                </div>
                <div className="help">TODO: real storage + downloads/previews.</div>
              </div>
            ) : (
              <div className="help" style={{ marginTop: 14 }}>
                No attachments.
              </div>
            )
          ) : (
            <div className="bannerDanger" style={{ marginTop: 14 }}>
              Plans and attachments are locked until a deposit is recorded .
            </div>
          )}
        </CardBody>
      </Card>
      </div>

      <Modal title="Add Milestone" open={timelineOpen} onClose={() => setTimelineOpen(false)}>
        <form
          onSubmit={handleSubmit(async (v) => {
            await addProjectTimelineEvent(projectId, {
              at: v.at,
              title: v.title,
              status: v.status as ProjectTimelineStatus,
              notes: v.notes ?? '',
            })
            const p = await getProject(projectId)
            setProject(p)
            setTimelineOpen(false)
          })}
          style={{ display: 'grid', gap: 14 }}
        >
          <div className="grid2">
            <div className="field">
              <div className="label">Date</div>
              <Input type="date" {...register('at')} />
              {errors.at ? <div className="error">{errors.at.message}</div> : null}
            </div>
            <div className="field">
              <div className="label">Status</div>
              <Select {...register('status')}>
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Done">Done</option>
              </Select>
              {errors.status ? <div className="error">{errors.status.message}</div> : null}
            </div>
          </div>

          <div className="field">
            <div className="label">Title</div>
            <Input placeholder="e.g. Framing completed" {...register('title')} />
            {errors.title ? <div className="error">{errors.title.message}</div> : null}
          </div>

          <div className="field">
            <div className="label">Notes</div>
            <Textarea rows={4} placeholder="Optional notes..." {...register('notes')} />
          </div>

          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button type="button" onClick={() => setTimelineOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              Add
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
