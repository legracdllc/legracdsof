import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  archiveEmployee,
  resetEmployeeCredentials,
  archiveProject,
  createEmployee,
  createProject,
  updateEmployee,
  listAllWorkOrders,
  listClients,
  listEmployees,
  listProjects,
  type ProjectAttachment,
  type Client,
  type Employee,
  type EmployeeRole,
  type Project,
  type ProjectStatus,
  type WorkOrder,
} from '../api/client'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { DataTable } from '../components/tables/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { StatusBadge } from '../components/ui/StatusBadge'
import { money } from '../components/ui/MoneyInput'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { InventoryTab } from '../components/inventory/InventoryTab'
import { FileUploadMock, type UploadMockFile } from '../components/ui/FileUploadMock'
import { Textarea } from '../components/ui/Textarea'
import { AddressAutocompleteInput } from '../components/ui/AddressAutocompleteInput'
import { useLanguage } from '../i18n/LanguageProvider'

const schema = z.object({
  projectName: z.string().min(2),
  clientId: z.string().optional().or(z.literal('')),
  isNewCustomer: z.boolean(),
  clientName: z.string().optional(),
  clientAddress: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().optional(),
  jobAddress: z.string().min(5),
  projectMeasurements: z.string().optional(),
  projectNotes: z.string().optional(),
  status: z.enum(['Active', 'Planning', 'Completed', 'On Hold']),
}).superRefine((v, ctx) => {
  if (v.isNewCustomer) {
    if (!v.clientName || v.clientName.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Customer name is required', path: ['clientName'] })
    }
    if (!v.clientAddress || v.clientAddress.trim().length < 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Customer address is required', path: ['clientAddress'] })
    }
    if (v.clientEmail && v.clientEmail.trim().length) {
      const ok = z.string().email().safeParse(v.clientEmail.trim()).success
      if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid email', path: ['clientEmail'] })
    }
  } else {
    if (!v.clientId || !v.clientId.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select an existing customer', path: ['clientId'] })
    }
  }
})

type FormValues = z.infer<typeof schema>

export function ProjectsListPage() {
  const nav = useNavigate()
  const { tr } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab') ?? 'projects'
  const tab =
    rawTab === 'customers' || rawTab === 'inventory' || rawTab === 'employees' ? rawTab : 'projects'

  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [open, setOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<UploadMockFile[]>([])
  const selectedCustomerId = searchParams.get('customerId') ?? ''
  const selectedEmployeeId = searchParams.get('employeeId') ?? ''

  const [empOpen, setEmpOpen] = useState(false)
  const [empShowArchived, setEmpShowArchived] = useState(false)
  const [empMode, setEmpMode] = useState<'new' | 'edit'>('new')
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null)
  const [empName, setEmpName] = useState('')
  const [empRole, setEmpRole] = useState<EmployeeRole>('Contractor')
  const [empUsername, setEmpUsername] = useState('')
  const [empPassword, setEmpPassword] = useState('1234')
  const [empPhone, setEmpPhone] = useState('')
  const [empEmail, setEmpEmail] = useState('')
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

  function setTab(next: 'projects' | 'customers' | 'inventory' | 'employees') {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', next)
    if (next !== 'customers') nextParams.delete('customerId')
    if (next !== 'employees') nextParams.delete('employeeId')
    setSearchParams(nextParams, { replace: true })
  }

  function renderMobileTabs() {
    return (
      <div className="projectsTabsRow">
        <Button type="button" variant={tab === 'projects' ? 'primary' : 'default'} onClick={() => setTab('projects')}>
          {tr('Projects')}
        </Button>
        <Button type="button" variant={tab === 'customers' ? 'primary' : 'default'} onClick={() => setTab('customers')}>
          {tr('Customers')}
        </Button>
        <Button type="button" variant={tab === 'inventory' ? 'primary' : 'default'} onClick={() => setTab('inventory')}>
          {tr('Inventory')}
        </Button>
        <Button type="button" variant={tab === 'employees' ? 'primary' : 'default'} onClick={() => setTab('employees')}>
          {tr('Employees')}
        </Button>
      </div>
    )
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectName: '',
      clientId: '',
      isNewCustomer: true,
      clientName: '',
      clientAddress: '',
      clientPhone: '',
      clientEmail: '',
      jobAddress: '',
      projectMeasurements: '',
      projectNotes: '',
      status: 'Planning',
    },
  })

  async function refresh() {
    await Promise.all([
      listProjects().then(setProjects).catch(() => setProjects([])),
      listClients().then(setClients).catch(() => setClients([])),
      listEmployees().then(setEmployees).catch(() => setEmployees([])),
      listAllWorkOrders().then(setWorkOrders).catch(() => setWorkOrders([])),
    ])
  }

  useEffect(() => {
    refresh()
  }, [])

  const isNewCustomer = watch('isNewCustomer')
  const formClientId = watch('clientId')
  const formClientAddress = watch('clientAddress') ?? ''
  const formJobAddress = watch('jobAddress') ?? ''

  const clientName = useMemo(() => {
    const map = new Map(clients.map((c) => [c.id, c.name]))
    return (id: string) => map.get(id) ?? 'Unknown'
  }, [clients])

  const selectedCustomer = useMemo(
    () => clients.find((c) => c.id === selectedCustomerId) ?? null,
    [clients, selectedCustomerId],
  )

  const selectedCustomerProjects = useMemo(() => {
    const id = selectedCustomer?.id
    if (!id) return []
    return projects.filter((p) => p.clientId === id)
  }, [projects, selectedCustomer])

  const cols = useMemo<ColumnDef<Project>[]>(
    () => [
      { header: tr('Project'), accessorKey: 'name' },
      {
        header: tr('Customer'),
        cell: ({ row }) => <span className="dashboardCustomerText">{clientName(row.original.clientId)}</span>,
      },
      { header: tr('Job address'), accessorKey: 'jobAddress' },
      {
        header: tr('Status'),
        cell: ({ row }) => (
          <div className="row" style={{ gap: 8 }}>
            <StatusBadge status={row.original.status} />
            {row.original.archivedAt ? <Badge tone="navy">{tr('Archived')}</Badge> : null}
          </div>
        ),
      },
      ...(isPhone
        ? []
        : ([
            {
              header: tr('Budget'),
              cell: ({ row }) => <span>{money.fmt(row.original.budgetTotal)}</span>,
            },
            {
              header: tr('Revenue'),
              cell: ({ row }) => <span>{money.fmt(row.original.revenue)}</span>,
            },
            {
              header: tr('Actions'),
              cell: ({ row }) => {
                const p = row.original
                const canArchive = !p.archivedAt
                return canArchive ? (
                  <Button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation()
                      const ok = window.confirm(`${tr('Archive project')} "${p.name}"?`)
                      if (!ok) return
                      await archiveProject(p.id)
                      await refresh()
                    }}
                  >
                    {tr('Archive')}
                  </Button>
                ) : (
                  <span className="help">-</span>
                )
              },
            },
          ] as ColumnDef<Project>[])),
    ],
    [clientName, isPhone, tr],
  )

  const visibleProjects = useMemo(
    () => (showArchived ? projects : projects.filter((p) => !p.archivedAt)),
    [projects, showArchived],
  )

  const customerCols = useMemo<ColumnDef<Client>[]>(
    () => [
      { header: tr('Customer'), accessorKey: 'name' },
      { header: tr('Address'), accessorKey: 'address' },
      { header: tr('Email'), accessorKey: 'email' },
      { header: tr('Phone'), accessorKey: 'phone' },
      {
        header: tr('Projects'),
        cell: ({ row }) => (
          <span>
            {projects.filter((p) => p.clientId === row.original.id && !p.archivedAt).length}
          </span>
        ),
      },
    ],
    [projects, tr],
  )

  const customerProjectCols = useMemo<ColumnDef<Project>[]>(
    () => [
      { header: tr('Project'), accessorKey: 'name' },
      { header: tr('Job address'), accessorKey: 'jobAddress' },
      {
        header: tr('Status'),
        cell: ({ row }) => (
          <div className="row" style={{ gap: 8 }}>
            <StatusBadge status={row.original.status} />
            {row.original.archivedAt ? <Badge tone="navy">{tr('Archived')}</Badge> : null}
          </div>
        ),
      },
    ],
    [tr],
  )

  const employeeCols = useMemo<ColumnDef<Employee>[]>(
    () => [
      { header: tr('Name'), accessorKey: 'name' },
      { header: tr('Role'), accessorKey: 'role' },
      { header: tr('Username'), cell: ({ row }) => <span>{row.original.username || row.original.phone || '-'}</span> },
      {
        header: tr('Status'),
        cell: ({ row }) => (
          <span className="help">
            {row.original.archivedAt ? tr('Archived') : row.original.active ? tr('Active') : tr('Inactive')}
          </span>
        ),
      },
      {
        header: tr('Actions'),
        cell: ({ row }) => {
          const e = row.original
          if (e.archivedAt) return <span className="help">-</span>
          return (
            <div className="row" style={{ gap: 8 }}>
              <Button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation()
                  openEditEmployee(e)
                }}
              >
                Edit
              </Button>
              <Button
                type="button"
                onClick={async (ev) => {
                  ev.stopPropagation()
                  await resetEmployeeCredentials(e.id)
                  await refresh()
                }}
              >
                {tr('Reset Credentials')}
              </Button>
              <Button
                type="button"
                onClick={async (ev) => {
                  ev.stopPropagation()
                  const ok = window.confirm(`${tr('Archive employee')} "${e.name}"?`)
                  if (!ok) return
                  await archiveEmployee(e.id)
                  await refresh()
                }}
              >
                {tr('Archive')}
              </Button>
            </div>
          )
        },
      },
    ],
    [tr],
  )

  const visibleEmployees = useMemo(
    () => (empShowArchived ? employees : employees.filter((e) => !e.archivedAt)),
    [employees, empShowArchived],
  )

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId) ?? null,
    [employees, selectedEmployeeId],
  )

  const selectedEmployeeWorkOrders = useMemo(() => {
    const id = selectedEmployee?.id
    if (!id) return []
    return workOrders.filter((w) => (w.assignedTo ?? []).includes(id))
  }, [selectedEmployee, workOrders])

  const selectedEmployeeProjects = useMemo(() => {
    const byId = new Map(projects.map((p) => [p.id, p]))
    const seen = new Set<string>()
    const out: Array<{ projectId: string; projectName: string; total: number; done: number }> = []
    for (const w of selectedEmployeeWorkOrders) {
      if (seen.has(w.projectId)) continue
      seen.add(w.projectId)
      const same = selectedEmployeeWorkOrders.filter((x) => x.projectId === w.projectId)
      const done = same.filter((x) => x.status === 'Done').length
      out.push({
        projectId: w.projectId,
        projectName: byId.get(w.projectId)?.name ?? w.projectId,
        total: same.length,
        done,
      })
    }
    return out
  }, [projects, selectedEmployeeWorkOrders])

  function openEditEmployee(employee: Employee) {
    setEmpMode('edit')
    setEditingEmpId(employee.id)
    setEmpName(employee.name)
    setEmpRole(employee.role)
    setEmpUsername(employee.username || employee.phone || '')
    setEmpPassword(employee.password || '1234')
    setEmpPhone(employee.phone || '')
    setEmpEmail(employee.email || '')
    setEmpOpen(true)
  }

  function openCreateProjectForCustomer(client: Client) {
    reset({
      projectName: '',
      status: 'Planning',
      isNewCustomer: false,
      clientId: client.id,
      clientName: '',
      clientAddress: '',
      clientPhone: '',
      clientEmail: '',
      jobAddress: '',
      projectMeasurements: '',
      projectNotes: '',
    })
    setMediaFiles([])
    setOpen(true)
  }

  if (tab === 'customers') {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {renderMobileTabs()}
        <Card>
          <CardHeader title={tr('Customers')} subtitle={tr('Customer list')} />
          <CardBody>
          <div className="grid2" style={{ alignItems: 'start' }}>
            <div>
              <DataTable
                data={clients}
                columns={customerCols}
                onRowClick={(c) => {
                  const next = new URLSearchParams(searchParams)
                  next.set('tab', 'customers')
                  next.set('customerId', c.id)
                  setSearchParams(next, { replace: true })
                }}
                emptyTitle={tr('No customers')}
                emptyDescription={tr('Customer list comes from clients.json + created projects.')}
              />
              <div className="help" style={{ marginTop: 10 }}>
                {tr('Tip: click a customer to open their file.')}
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>{tr('Customer File')}</div>
                  <div className="help">{tr('Personal info + linked projects')}</div>
                </div>
                {selectedCustomer ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => openCreateProjectForCustomer(selectedCustomer)}
                  >
                    {tr('New Project')}
                  </Button>
                ) : null}
              </div>

              {!selectedCustomer ? (
                <div className="help" style={{ marginTop: 12 }}>
                  {tr('Select a customer from the table to see details here.')}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 14, marginTop: 12 }}>
                  <div className="card" style={{ padding: 14, background: 'rgba(14, 28, 40, 0.04)' }}>
                    <div className="label">{tr('Name')}</div>
                    <div style={{ fontWeight: 800 }}>{selectedCustomer.name}</div>
                    <div className="grid2" style={{ marginTop: 10 }}>
                      <div>
                        <div className="label">{tr('Email')}</div>
                        <div className="help">{selectedCustomer.email || '-'}</div>
                      </div>
                      <div>
                        <div className="label">{tr('Phone')}</div>
                        <div className="help">{selectedCustomer.phone || '-'}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <div className="label">{tr('Address')}</div>
                      <div className="help">{selectedCustomer.address || '-'}</div>
                    </div>
                  </div>

                  <div className="customerProjectsTable">
                    <div className="label" style={{ marginBottom: 8 }}>
                      {tr('Projects')}
                    </div>
                    <DataTable
                      data={selectedCustomerProjects}
                      columns={customerProjectCols}
                      onRowClick={(p) => nav(`/projects/${p.id}`)}
                      emptyTitle={tr('No projects for this customer')}
                      emptyDescription={tr('Create a project to link it to this customer.')}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (tab === 'inventory') {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {renderMobileTabs()}
        <InventoryTab />
      </div>
    )
  }

  if (tab === 'employees') {
    return (
      <div className="employeesPage" style={{ display: 'grid', gap: 12 }}>
        {renderMobileTabs()}
        <Card>
          <CardHeader
            title={tr('Employees')}
            subtitle={tr('Contractors / employees')}
            right={
              <div className="row" style={{ gap: 10 }}>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setEmpMode('new')
                    setEditingEmpId(null)
                    setEmpName('')
                    setEmpRole('Contractor')
                    setEmpUsername('')
                    setEmpPassword('1234')
                    setEmpPhone('')
                    setEmpEmail('')
                    setEmpOpen(true)
                  }}
                >
                  {tr('Add Employee')}
                </Button>
                <Button type="button" onClick={() => setEmpShowArchived((v) => !v)}>
                  {empShowArchived ? tr('Hide Archived') : tr('Show Archived')}
                </Button>
              </div>
            }
          />
          <CardBody>
            <div className="employeesLayout">
              <div className="employeesTablePane">
                <DataTable
                  data={visibleEmployees}
                  columns={employeeCols}
                  onRowClick={(e) => {
                    const next = new URLSearchParams(searchParams)
                    next.set('tab', 'employees')
                    next.set('employeeId', e.id)
                    setSearchParams(next, { replace: true })
                  }}
                  emptyTitle={tr('No employees')}
                  emptyDescription={tr('Add employees/contractors to assign work orders.')}
                />
                <div className="help" style={{ marginTop: 10 }}>
                  Tap an employee to open their file.
                </div>
              </div>

              <div className="card employeesFilePane" style={{ padding: 16 }}>
                <div style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>Employee File</div>
                <div className="help">Profile + projects performed</div>

                {!selectedEmployee ? (
                  <div className="help" style={{ marginTop: 12 }}>
                    Select an employee from the table to see details here.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                    <div className="card" style={{ padding: 14, background: 'rgba(14, 28, 40, 0.04)' }}>
                      <div className="label">{tr('Name')}</div>
                      <div style={{ fontWeight: 800 }}>{selectedEmployee.name}</div>
                      <div className="grid2" style={{ marginTop: 10 }}>
                        <div>
                          <div className="label">{tr('Role')}</div>
                          <div className="help">{selectedEmployee.role}</div>
                        </div>
                        <div>
                          <div className="label">{tr('Status')}</div>
                          <div className="help">
                            {selectedEmployee.archivedAt ? tr('Archived') : selectedEmployee.active ? tr('Active') : tr('Inactive')}
                          </div>
                        </div>
                      </div>
                      <div className="grid2" style={{ marginTop: 10 }}>
                        <div>
                          <div className="label">{tr('Phone')}</div>
                          <div className="help">{selectedEmployee.phone || '-'}</div>
                        </div>
                        <div>
                          <div className="label">{tr('Email')}</div>
                          <div className="help">{selectedEmployee.email || '-'}</div>
                        </div>
                      </div>
                      <div className="grid2" style={{ marginTop: 10 }}>
                        <div>
                          <div className="label">{tr('Username')}</div>
                          <div className="help">{selectedEmployee.username || '-'}</div>
                        </div>
                        <div>
                          <div className="label">{tr('Password')}</div>
                          <div className="help">{selectedEmployee.password || '1234'}</div>
                        </div>
                      </div>
                      {!selectedEmployee.archivedAt ? (
                        <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
                          <Button type="button" onClick={() => openEditEmployee(selectedEmployee)}>
                            Edit Employee
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <div className="label" style={{ marginBottom: 8 }}>
                        {tr('Projects')}
                      </div>
                      {!selectedEmployeeProjects.length ? (
                        <div className="help">No related projects yet.</div>
                      ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                          {selectedEmployeeProjects.map((x) => (
                            <div key={x.projectId} className="card" style={{ padding: 12 }}>
                              <div className="row" style={{ justifyContent: 'space-between' }}>
                                <div style={{ fontWeight: 800 }}>{x.projectName}</div>
                                <Button type="button" onClick={() => nav(`/projects/${x.projectId}`)}>
                                  Open
                                </Button>
                              </div>
                              <div className="help" style={{ marginTop: 6 }}>
                                Work orders: {x.done}/{x.total} done
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        <Modal title={empMode === 'edit' ? 'Edit Employee' : tr('Add Employee')} open={empOpen} onClose={() => setEmpOpen(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!empName.trim()) return
              if (empMode === 'edit' && editingEmpId) {
                await updateEmployee({
                  id: editingEmpId,
                  name: empName.trim(),
                  role: empRole,
                  username: empUsername.trim() || empPhone.trim(),
                  password: empPassword.trim() || '1234',
                  phone: empPhone.trim(),
                  email: empEmail.trim(),
                })
              } else {
                await createEmployee({
                  name: empName.trim(),
                  role: empRole,
                  username: empUsername.trim() || empPhone.trim(),
                  password: empPassword.trim() || '1234',
                  phone: empPhone.trim(),
                  email: empEmail.trim(),
                })
              }
              setEmpOpen(false)
              await refresh()
            }}
            style={{ display: 'grid', gap: 14 }}
          >
            <div className="grid2">
              <div className="field">
                <div className="label">{tr('Name')}</div>
                <Input value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder={tr('Name')} />
              </div>
              <div className="field">
                <div className="label">{tr('Role')}</div>
                <Select value={empRole} onChange={(e) => setEmpRole(e.target.value as EmployeeRole)}>
                  <option value="Contractor">Contractor</option>
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin</option>
                </Select>
              </div>
            </div>
            <div className="grid2">
              <div className="field">
                <div className="label">{tr('Phone')}</div>
                <Input value={empPhone} onChange={(e) => setEmpPhone(e.target.value)} placeholder="" />
                <div className="help">Optional</div>
              </div>
              <div className="field">
                <div className="label">{tr('Username')}</div>
                <Input value={empUsername} onChange={(e) => setEmpUsername(e.target.value)} placeholder="" />
              </div>
            </div>
            <div className="grid2">
              <div className="field">
                <div className="label">{tr('Password')}</div>
                <Input value={empPassword} onChange={(e) => setEmpPassword(e.target.value)} placeholder="" />
                <div className="help">Set employee password</div>
              </div>
              <div className="field">
                <div className="label">{tr('Email')}</div>
                <Input value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} placeholder="" />
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button type="button" onClick={() => setEmpOpen(false)}>
                {tr('Cancel')}
              </Button>
              <Button type="submit" variant="primary">
                {tr('Save')}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    )
  }

  return (
    <div className="projectsPage" style={{ display: 'grid', gap: 12 }}>
      {renderMobileTabs()}
      <Card>
        <CardHeader
          title={tr('Dashboard')}
          subtitle={tr('Projects. Create a project to get started.')}
        />
        <CardBody>
        <div className="row projectsActionsRow" style={{ marginBottom: 14 }}>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              reset()
              setMediaFiles([])
              setOpen(true)
            }}
          >
            {tr('Create Project')}
          </Button>
          <Button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? tr('Hide Archived') : tr('Show Archived')}
          </Button>
        </div>
        <DataTable
          data={visibleProjects}
          columns={cols}
          onRowClick={(p) => nav(`/projects/${p.id}`)}
          emptyTitle={tr('No projects')}
          emptyDescription={tr('Create your first project to start invoices, project financials, and work orders.')}
        />
        </CardBody>

        {open ? (
        <div
          className="card projectCreateCard"
          style={{
            margin: '16px 24px 24px',
            borderColor: 'rgba(14, 28, 40, 0.22)',
            boxShadow: 'var(--shadow-2)',
          }}
        >
          <div className="cardHeader row projectCreateHeaderRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 900 }}>{tr('Create Project')}</div>
            <Button type="button" onClick={() => setOpen(false)}>
              {tr('Close')}
            </Button>
          </div>
          <div className="cardBody projectCreateBody" style={{ maxHeight: '72vh', overflow: 'auto' }}>
            <form
          className="projectCreateForm"
          onSubmit={handleSubmit(async (v) => {
            const now = new Date().toISOString()
            const attachments: ProjectAttachment[] = [
              ...mediaFiles.map((f) => ({
                id: f.id,
                kind: 'Media' as const,
                name: f.name,
                uploadedAt: now,
                previewUrl: f.previewUrl,
              })),
            ]
            const p = await createProject({
              projectName: v.projectName,
              clientId: v.isNewCustomer ? undefined : v.clientId?.trim() || undefined,
              clientName: v.isNewCustomer ? v.clientName : undefined,
              clientAddress: v.isNewCustomer ? v.clientAddress : undefined,
              clientPhone: v.isNewCustomer ? v.clientPhone : undefined,
              clientEmail: v.isNewCustomer ? v.clientEmail : undefined,
              jobAddress: v.jobAddress,
              projectMeasurements: v.projectMeasurements,
              projectNotes: v.projectNotes,
              attachments,
              status: v.status as ProjectStatus,
              budgetTotal: 0,
              revenue: 0,
            })
            setOpen(false)
            await refresh()
            nav(`/projects/${p.id}`)
          })}
          style={{ display: 'grid', gap: 14 }}
        >
          <input type="hidden" {...register('isNewCustomer')} />
          <input type="hidden" {...register('clientAddress')} />
          <input type="hidden" {...register('jobAddress')} />
          <div className="grid2">
            <div className="field">
              <div className="label">{tr('Project name')}</div>
              <Input placeholder={tr('e.g. Garage to APT')} {...register('projectName')} />
              {errors.projectName ? <div className="error">{errors.projectName.message}</div> : null}
            </div>
            <div className="field">
              <div className="label">{tr('Status')}</div>
              <Select {...register('status')}>
                <option value="Planning">{tr('Planning')}</option>
                <option value="Active">{tr('Active')}</option>
                <option value="On Hold">{tr('On Hold')}</option>
                <option value="Completed">{tr('Completed')}</option>
              </Select>
            </div>
          </div>

          <div className="field">
            <div className="label">{tr('Customer')}</div>
            <div className="row projectCustomerSwitchRow" style={{ gap: 10, flexWrap: 'wrap' }}>
              <Button
                type="button"
                variant={isNewCustomer ? 'primary' : 'default'}
                onClick={() => {
                  setValue('isNewCustomer', true, { shouldValidate: true })
                  setValue('clientId', '', { shouldValidate: true })
                }}
              >
                {tr('New customer')}
              </Button>
              <Button
                type="button"
                variant={!isNewCustomer ? 'primary' : 'default'}
                onClick={() => {
                  setValue('isNewCustomer', false, { shouldValidate: true })
                }}
              >
                {tr('Existing customer')}
              </Button>
            </div>
            <div className="help" style={{ marginTop: 8 }}>
              {tr('Pick an existing customer or enter a new one.')}
            </div>
          </div>

          {!isNewCustomer ? (
            <>
              <div className="field">
                <div className="label">{tr('Select customer')}</div>
                <Select
                  {...register('clientId')}
                  value={formClientId || ''}
                  onChange={(e) => {
                    setValue('clientId', e.target.value, { shouldValidate: true })
                  }}
                >
                  <option value="">{tr('Select...')}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                {errors.clientId ? <div className="error">{errors.clientId.message}</div> : null}
              </div>
              {(() => {
                const c = clients.find((x) => x.id === formClientId)
                if (!c) return null
                return (
                  <div className="card" style={{ padding: 14, background: 'rgba(14, 28, 40, 0.04)' }}>
                    <div style={{ fontWeight: 800 }}>{c.name}</div>
                    <div className="help" style={{ marginTop: 6 }}>
                      {c.address || '-'}
                    </div>
                    <div className="row" style={{ gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                      <span className="help">{tr('Email')}: {c.email || '-'}</span>
                      <span className="help">{tr('Phone')}: {c.phone || '-'}</span>
                    </div>
                  </div>
                )
              })()}
            </>
          ) : (
            <>
              <div className="grid2">
                <div className="field">
                  <div className="label">{tr('Customer name')}</div>
                  <Input placeholder={tr('Customer')} {...register('clientName')} />
                  {errors.clientName ? <div className="error">{errors.clientName.message}</div> : null}
                </div>
                <div className="field">
                  <div className="label">{tr('Customer address')}</div>
                  <AddressAutocompleteInput
                    value={formClientAddress}
                    onChange={(next) =>
                      setValue('clientAddress', next, { shouldValidate: true, shouldDirty: true })
                    }
                    placeholder={tr('Customer address')}
                  />
                  {errors.clientAddress ? <div className="error">{errors.clientAddress.message}</div> : null}
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <div className="label">{tr('Customer phone')}</div>
                  <Input placeholder="(000) 000-0000" {...register('clientPhone')} />
                </div>
                <div className="field">
                  <div className="label">{tr('Customer email')}</div>
                  <Input placeholder="name@email.com" {...register('clientEmail')} />
                  {errors.clientEmail ? <div className="error">{errors.clientEmail.message}</div> : null}
                </div>
              </div>
            </>
          )}

          <div className="field">
            <div className="label">{tr('Job address')}</div>
            <AddressAutocompleteInput
              value={formJobAddress}
              onChange={(next) => setValue('jobAddress', next, { shouldValidate: true, shouldDirty: true })}
              placeholder={tr('Job location address')}
            />
            {errors.jobAddress ? <div className="error">{errors.jobAddress.message}</div> : null}
          </div>

          <div className="grid2">
            <div className="field">
              <div className="label">{tr('Measurements')}</div>
              <Textarea
                rows={4}
                placeholder={tr('Enter measurements (e.g. Room A: 12ft x 10ft, Ceiling 8ft...)')}
                {...register('projectMeasurements')}
              />
              <div className="help">{tr('Stored as text for now. TODO: structured measurements.')}</div>
            </div>

            <div className="field">
              <div className="label">{tr('Project media')}</div>
              <FileUploadMock onAdd={(files) => setMediaFiles((prev) => [...files, ...prev])} />
              {mediaFiles.length ? (
                <div className="thumbs" style={{ marginTop: 10 }}>
                  {mediaFiles.slice(0, 10).map((m) => (
                    <img key={m.id} className="thumb" src={m.previewUrl} alt={m.name} />
                  ))}
                </div>
              ) : (
                <div className="help" style={{ marginTop: 8 }}>
                  {tr('No media added.')}
                </div>
              )}
            </div>
          </div>

          <div className="field">
            <div className="label">{tr('Notes')}</div>
            <Textarea rows={4} placeholder={tr('Project notes...')} {...register('projectNotes')} />
          </div>

          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button type="button" onClick={() => setOpen(false)}>
              {tr('Cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {tr('Create')}
            </Button>
          </div>
            </form>
          </div>
        </div>
        ) : null}
      </Card>
    </div>
  )
}
