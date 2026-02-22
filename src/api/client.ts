import auth from '../mock/auth.json'
import projects from '../mock/projects.json'
import clients from '../mock/clients.json'
import invoices from '../mock/invoices.json'
import invoiceItems from '../mock/invoiceItems.json'
import payments from '../mock/payments.json'
import ledger from '../mock/ledger.json'
import workorders from '../mock/workorders.json'
import retailSnapshots from '../mock/retailSnapshots.json'
import employees from '../mock/employees.json'
import packages from '../mock/packages.json'

export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true'
const USE_SUPABASE_EMPLOYEES = (import.meta.env.VITE_USE_SUPABASE_EMPLOYEES ?? 'false') === 'true'
const USE_SUPABASE_WORKORDERS = (import.meta.env.VITE_USE_SUPABASE_WORKORDERS ?? 'false') === 'true'
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '')
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

function defaultEmployeeUsername(e: Pick<Employee, 'id' | 'name' | 'email' | 'phone' | 'username'>): string {
  const fromUsername = (e.username ?? '').trim()
  if (fromUsername) return fromUsername
  const fromPhone = (e.phone ?? '').trim()
  if (fromPhone) return fromPhone
  const fromEmail = (e.email ?? '').trim().split('@')[0] ?? ''
  if (fromEmail) return fromEmail
  const fromName = (e.name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')
  if (fromName) return fromName
  return (e.id ?? '').trim() || 'employee'
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeIdentifierCompact(value: string): string {
  return normalizeIdentifier(value).replace(/\s+/g, '')
}

function normalizeIdentifierLoose(value: string): string {
  return normalizeIdentifier(value).replace(/[^a-z0-9]+/g, '')
}

function collectAssigneeTokens(assignedTo: unknown[] | null | undefined): string[] {
  if (!Array.isArray(assignedTo)) return []
  const out: string[] = []
  for (const raw of assignedTo) {
    if (typeof raw === 'string') {
      out.push(raw)
      continue
    }
    if (raw && typeof raw === 'object') {
      const item = raw as Record<string, unknown>
      const fields = [item.id, item.name, item.username, item.phone, item.email]
      for (const f of fields) {
        if (typeof f === 'string' && f.trim()) out.push(f)
      }
    }
  }
  return out
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D+/g, '')
}

function isSupabaseEmployeesEnabled() {
  return USE_SUPABASE_EMPLOYEES && Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

function isSupabaseWorkOrdersEnabled() {
  return USE_SUPABASE_WORKORDERS && Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export type User = {
  id: string
  name: string
  email: string
}

export type ProjectStatus = 'Active' | 'Planning' | 'Completed' | 'On Hold'
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Voided'
export type WorkOrderStatus = 'Not Started' | 'In Progress' | 'Blocked' | 'Done'
export type WorkOrderPriority = 'Low' | 'Medium' | 'High'

export type Client = {
  id: string
  name: string
  address: string
  phone?: string
  email?: string
}

export type Project = {
  id: string
  name: string
  clientId: string
  status: ProjectStatus
  jobAddress: string
  jobPhone: string
  apptDate: string
  budgetTotal: number
  revenue: number
  customerPaid: number
  reminder: string
  archivedAt?: string | null
  // Workflow
  depositReceivedAt?: string | null
  depositAmount?: number
  startDateProposed?: string | null // YYYY-MM-DD
  startDateProposedAt?: string | null
  startDateApprovedAt?: string | null
  measurements?: string
  notes?: string
  attachments?: ProjectAttachment[]
  timeline?: ProjectTimelineEvent[]
}

export type ProjectAttachmentKind = 'Measurement' | 'Media'
export type ProjectAttachment = {
  id: string
  kind: ProjectAttachmentKind
  name: string
  mime?: string
  size?: number
  uploadedAt: string
  // For mock previews only (object URLs won't persist across reloads).
  previewUrl?: string
}

export type ProjectTimelineStatus = 'Planned' | 'In Progress' | 'Done' | 'Blocked'
export type ProjectTimelineEvent = {
  id: string
  at: string // YYYY-MM-DD
  title: string
  status: ProjectTimelineStatus
  notes?: string
}

export type Invoice = {
  id: string
  projectId: string
  invoiceNo: string
  type: 'Estimate' | 'Invoice'
  status: InvoiceStatus
  sentAt?: string | null
  clientApprovedAt?: string | null
  salesperson: string
  job: string
  shippingMethod: string
  shippingTerms: string
  deliveryDate: string
  paymentTerms: string
  dueDate: string
  discount: number
}

export type InvoiceItem = {
  id: string
  invoiceId: string
  qty: number
  itemNo: string
  description: string
  unitPrice: number
}

export type PaymentSchedule = {
  invoiceId: string
  downPayment: number
  secondPayment: number
  thirdPayment: number
  finalPayment: number
}

export type LedgerRow2 = { id: string; item: string; total: number }
export type LedgerRow4 = { id: string; job: string; cost: number; paid: number; reminder: string }
export type LedgerDoc = {
  projectId: string
  homeDepotLowes: LedgerRow2[]
  amazon: LedgerRow2[]
  subContractor: LedgerRow4[]
}

export type ProjectMaterial = {
  id: string
  projectId: string
  source: 'Quote' | 'Manual'
  name: string
  sku?: string
  inventoryItemId?: string | null
  qty: number
  unitCostEstimate: number
  purchased: boolean
  purchasedAt?: string | null
  purchasedCost?: number
  supplierId?: string | null
}

export type LaborEntry = {
  id: string
  projectId: string
  date: string // YYYY-MM-DD
  process: string
  hours: number
  rate: number
  notes?: string
}

export type WorkOrderChecklistItem = { id: string; text: string; done: boolean }
export type WorkOrderNote = { id: string; at: string; author: string; text: string }
export type WorkOrderMedia = { id: string; name: string; previewUrl: string }
export type WorkOrderRequestType = 'Material' | 'Tool'
export type WorkOrderRequestStatus = 'Requested' | 'Approved' | 'Fulfilled'
export type WorkOrderRequest = {
  id: string
  type: WorkOrderRequestType
  itemName: string
  qty: number
  neededBy?: string
  status: WorkOrderRequestStatus
  notes?: string
}
export type WorkOrder = {
  id: string
  projectId: string
  title: string
  status: WorkOrderStatus
  priority: WorkOrderPriority
  startDate: string
  endDate: string
  assignedTo: string[]
  checklist: WorkOrderChecklistItem[]
  notes: WorkOrderNote[]
  media: WorkOrderMedia[]
  requests?: WorkOrderRequest[]
  scopeDraft?: {
    generatedAt: string
    source?: string
    title: string
    tasks: string[]
    checklist: string[]
    processEs: string[]
  }
}

export type EmployeeRole = 'Admin' | 'Employee' | 'Contractor'
export type Employee = {
  id: string
  name: string
  role: EmployeeRole
  username?: string
  password?: string
  phone?: string
  email?: string
  active: boolean
  archivedAt?: string | null
}

export type EmployeeSession = {
  employeeId: string
}

type SupabaseEmployeeRow = {
  id: string
  name: string
  role: EmployeeRole
  username: string | null
  password: string | null
  phone: string | null
  email: string | null
  active: boolean | null
  archived_at: string | null
}

type SupabaseWorkOrderRow = {
  id: string
  project_id: string
  title: string
  status: WorkOrderStatus
  priority: WorkOrderPriority
  start_date: string
  end_date: string
  assigned_to: string[] | null
  checklist: WorkOrderChecklistItem[] | null
  notes: WorkOrderNote[] | null
  media: WorkOrderMedia[] | null
  requests: WorkOrderRequest[] | null
  scope_draft: WorkOrder['scopeDraft'] | null
}

type RetailSnapshots = {
  suppliers?: Supplier[]
  inventoryItems?: InventoryItem[]
  purchaseOrders: Array<{
    id: string
    projectId: string
    vendor: string
    color: string
    items: string[]
  }>
}

export type Supplier = {
  id: string
  name: string
  phone?: string
  email?: string
  website?: string
  notes?: string
  archivedAt?: string | null
}

export type InventoryItemType = 'Material' | 'Tool'

export type InventoryItem = {
  id: string
  type: InventoryItemType
  category?: string
  name: string
  sku?: string
  unit: string
  supplierId?: string | null
  unitCost: number
  qtyOnHand: number
  reorderPoint: number
  reorderQty?: number
  notes?: string
  archivedAt?: string | null
}

export type QuotePackageItem = {
  id: string
  itemNo: string
  description: string
  qty: number
  unitPrice: number
  kind?: 'Material' | 'Labor'
  inventoryItemId?: string | null
}

export type QuotePackage = {
  id: string
  name: string
  specifications: string
  includes: string
  items: QuotePackageItem[]
  archivedAt?: string | null
}

const LS = {
  token: 'legra:token',
  employeeSession: 'legra:employee:session',
  projects: 'legra:mock:projects',
  clients: 'legra:mock:clients',
  invoices: 'legra:mock:invoices',
  invoiceItems: 'legra:mock:invoiceItems',
  payments: 'legra:mock:payments',
  ledger: 'legra:mock:ledger',
  workorders: 'legra:mock:workorders',
  suppliers: 'legra:mock:suppliers',
  inventoryItems: 'legra:mock:inventoryItems',
  employees: 'legra:mock:employees',
  projectMaterials: 'legra:mock:projectMaterials',
  labor: 'legra:mock:labor',
  packages: 'legra:mock:packages',
}

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

function requireSupabaseEmployeesConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase employees mode is enabled, but VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.')
  }
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY }
}

function mapSupabaseEmployee(row: SupabaseEmployeeRow): Employee {
  const base: Employee = {
    id: row.id,
    name: row.name ?? '',
    role: (row.role ?? 'Employee') as EmployeeRole,
    username: row.username ?? '',
    password: row.password ?? '1234',
    phone: row.phone ?? '',
    email: row.email ?? '',
    active: row.active !== false,
    archivedAt: row.archived_at ?? null,
  }
  return {
    ...base,
    username: defaultEmployeeUsername(base),
    password: (base.password ?? '1234').trim() || '1234',
  }
}

function toSupabaseEmployeePatch(input: {
  id?: string
  name?: string
  role?: EmployeeRole
  username?: string
  password?: string
  phone?: string
  email?: string
  active?: boolean
  archivedAt?: string | null
}) {
  const out: Record<string, unknown> = {}
  if (input.id !== undefined) out.id = input.id
  if (input.name !== undefined) out.name = input.name
  if (input.role !== undefined) out.role = input.role
  if (input.username !== undefined) out.username = input.username
  if (input.password !== undefined) out.password = input.password
  if (input.phone !== undefined) out.phone = input.phone
  if (input.email !== undefined) out.email = input.email
  if (input.active !== undefined) out.active = input.active
  if (input.archivedAt !== undefined) out.archived_at = input.archivedAt
  return out
}

function normalizeWorkOrderMedia(input: unknown): WorkOrderMedia[] {
  if (!Array.isArray(input)) return []
  return input.map((raw) => {
    const item = (raw ?? {}) as Record<string, unknown>
    const id = String(item.id ?? `m_${crypto.randomUUID()}`)
    const name = String(item.name ?? item.filename ?? 'Media file')
    const previewUrl = String(item.previewUrl ?? item.preview_url ?? item.url ?? item.uri ?? '')
    return { id, name, previewUrl }
  })
}

function normalizeWorkOrder(order: WorkOrder): WorkOrder {
  return {
    ...order,
    media: normalizeWorkOrderMedia(order.media),
  }
}

function mapSupabaseWorkOrder(row: SupabaseWorkOrderRow): WorkOrder {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    startDate: row.start_date,
    endDate: row.end_date,
    assignedTo: Array.isArray(row.assigned_to) ? row.assigned_to : [],
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    notes: Array.isArray(row.notes) ? row.notes : [],
    media: normalizeWorkOrderMedia(row.media),
    requests: Array.isArray(row.requests) ? row.requests : [],
    scopeDraft: row.scope_draft ?? undefined,
  }
}

function toSupabaseWorkOrderPatch(order: WorkOrder) {
  return {
    id: order.id,
    project_id: order.projectId,
    title: order.title,
    status: order.status,
    priority: order.priority,
    start_date: order.startDate,
    end_date: order.endDate,
    assigned_to: order.assignedTo ?? [],
    checklist: order.checklist ?? [],
    notes: order.notes ?? [],
    media: order.media ?? [],
    requests: order.requests ?? [],
    scope_draft: order.scopeDraft ?? null,
  }
}

async function supabaseEmployeesRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { url, anonKey } = requireSupabaseEmployeesConfig()
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!response.ok) {
    let detail = ''
    try {
      const body = await response.json()
      detail = (body?.message ?? body?.error_description ?? body?.error ?? '').toString()
    } catch {
      detail = await response.text()
    }
    const missingWorkordersTable =
      /Could not find the table 'public\.workorders'/i.test(detail) || /relation "workorders" does not exist/i.test(detail)
    if (missingWorkordersTable) {
      throw new Error(
        "Supabase is missing table public.workorders. Create it in Supabase SQL Editor (see README section 'Shared Employee Login (Supabase)') and run: notify pgrst, 'reload schema';",
      )
    }
    const suffix = detail ? `: ${detail}` : ''
    throw new Error(`Supabase request failed (${response.status})${suffix}`)
  }
  if (response.status === 204) return null as T
  return (await response.json()) as T
}

function appendTimelineEvent(project: Project, ev: ProjectTimelineEvent): Project {
  const existing = project.timeline ?? []
  // Prevent duplicates by title+date (good enough for mock workflow).
  if (existing.some((x) => x.title === ev.title && x.at === ev.at)) return project
  return { ...project, timeline: [ev, ...existing] }
}

function ensureSeeded() {
  if (!localStorage.getItem(LS.projects)) writeJson(LS.projects, projects)
  if (!localStorage.getItem(LS.clients)) writeJson(LS.clients, clients)
  if (!localStorage.getItem(LS.invoices)) writeJson(LS.invoices, invoices)
  if (!localStorage.getItem(LS.invoiceItems)) writeJson(LS.invoiceItems, invoiceItems)
  if (!localStorage.getItem(LS.payments)) writeJson(LS.payments, payments)
  if (!localStorage.getItem(LS.ledger)) writeJson(LS.ledger, ledger)
  if (!localStorage.getItem(LS.workorders)) writeJson(LS.workorders, workorders)
  const rs = retailSnapshots as RetailSnapshots
  if (!localStorage.getItem(LS.suppliers)) writeJson(LS.suppliers, rs.suppliers ?? [])
  // Seed inventory items and merge in newly added seed items over time (without clobbering user edits).
  const seedInv = (rs.inventoryItems ?? []) as InventoryItem[]
  if (!localStorage.getItem(LS.inventoryItems)) {
    writeJson(LS.inventoryItems, seedInv)
  } else {
    const existing = readJson<InventoryItem[]>(LS.inventoryItems, seedInv)
    const byId = new Map(existing.map((it) => [it.id, it]))
    let changed = false
    for (const seed of seedInv) {
      const cur = byId.get(seed.id)
      if (!cur) {
        byId.set(seed.id, seed)
        changed = true
        continue
      }
      // Backfill category for older saved items.
      if ((!cur.category || !cur.category.trim()) && seed.category && seed.category.trim()) {
        byId.set(seed.id, { ...cur, category: seed.category })
        changed = true
      }
    }
    if (changed) writeJson(LS.inventoryItems, Array.from(byId.values()))
  }
  if (!localStorage.getItem(LS.employees)) writeJson(LS.employees, employees)
  if (!localStorage.getItem(LS.projectMaterials)) writeJson(LS.projectMaterials, [])
  if (!localStorage.getItem(LS.labor)) writeJson(LS.labor, [])
  if (!localStorage.getItem(LS.packages)) writeJson(LS.packages, packages)
}

export function isAuthed() {
  return Boolean(localStorage.getItem(LS.token))
}

export function isEmployeeAuthed() {
  return Boolean(localStorage.getItem(LS.employeeSession))
}

export function logout() {
  localStorage.removeItem(LS.token)
  localStorage.removeItem(LS.employeeSession)
}

export async function login(username: string, password: string): Promise<User> {
  if (!USE_MOCK) throw new Error('TODO: real backend login')
  if (username !== 'admin' || password !== 'admin') {
    throw new Error('Invalid credentials')
  }
  localStorage.setItem(LS.token, auth.token)
  return { ...auth.defaultUser, email: 'admin@legra.mock' }
}

export async function me(): Promise<User | null> {
  if (!USE_MOCK) throw new Error('TODO: real backend me()')
  if (!isAuthed()) return null
  return auth.defaultUser
}

export async function employeeLogin(identifier: string, password: string): Promise<Employee> {
  if (!isSupabaseEmployeesEnabled() && !USE_MOCK) throw new Error('TODO: real backend employeeLogin')
  if (USE_MOCK) ensureSeeded()
  const all = await listEmployees()
  const normalized = normalizeIdentifier(identifier)
  const normalizedCompact = normalizeIdentifierCompact(identifier)
  const normalizedDigits = normalizePhoneDigits(identifier)
  const matchAnyStatus =
    all.find((e) => normalizeIdentifier(e.username ?? '') === normalized) ??
    all.find((e) => normalizeIdentifierCompact(e.username ?? '') === normalizedCompact) ??
    all.find((e) => normalizeIdentifier(e.phone ?? '') === normalized) ??
    all.find((e) => normalizeIdentifierCompact(e.phone ?? '') === normalizedCompact) ??
    all.find((e) => normalizeIdentifier(e.email ?? '') === normalized) ??
    all.find((e) => normalizeIdentifierCompact(e.email ?? '') === normalizedCompact) ??
    all.find((e) => normalizeIdentifier(e.name) === normalized) ??
    all.find((e) => normalizeIdentifierCompact(e.name) === normalizedCompact) ??
    all.find((e) => {
      if (!normalizedDigits) return false
      const phoneDigits = normalizePhoneDigits(e.phone ?? '')
      const usernameDigits = normalizePhoneDigits(e.username ?? '')
      if (!phoneDigits && !usernameDigits) return false
      return (
        (phoneDigits &&
          (phoneDigits === normalizedDigits ||
            phoneDigits.endsWith(normalizedDigits) ||
            normalizedDigits.endsWith(phoneDigits))) ||
        (usernameDigits &&
          (usernameDigits === normalizedDigits ||
            usernameDigits.endsWith(normalizedDigits) ||
            normalizedDigits.endsWith(usernameDigits)))
      )
    })
  if (!matchAnyStatus) throw new Error('Employee not found or inactive')
  if (matchAnyStatus.archivedAt || matchAnyStatus.active === false) throw new Error('Employee is inactive')
  if ((matchAnyStatus.password ?? '1234') !== password) throw new Error('Invalid employee credentials')
  writeJson<EmployeeSession>(LS.employeeSession, { employeeId: matchAnyStatus.id })
  return matchAnyStatus
}

export async function employeeMe(): Promise<Employee | null> {
  if (!isSupabaseEmployeesEnabled() && !USE_MOCK) throw new Error('TODO: real backend employeeMe')
  if (USE_MOCK) ensureSeeded()
  const raw = readJson<EmployeeSession | null>(LS.employeeSession, null)
  if (!raw?.employeeId) return null
  if (isSupabaseEmployeesEnabled()) {
    const rows = await supabaseEmployeesRequest<SupabaseEmployeeRow[]>(
      `employees?select=*&id=eq.${encodeURIComponent(raw.employeeId)}&limit=1`,
    )
    const found = rows.length ? mapSupabaseEmployee(rows[0]) : null
    if (!found || found.archivedAt || !found.active) return null
    return found
  }
  const all = readJson<Employee[]>(LS.employees, employees as Employee[])
  const found = all.find((e) => e.id === raw.employeeId) ?? null
  if (!found || found.archivedAt || !found.active) return null
  return found
}

export async function employeeChangePassword(currentPassword: string, nextPassword: string): Promise<void> {
  if (!isSupabaseEmployeesEnabled() && !USE_MOCK) throw new Error('TODO: real backend employeeChangePassword')
  if (USE_MOCK) ensureSeeded()
  const raw = readJson<EmployeeSession | null>(LS.employeeSession, null)
  if (!raw?.employeeId) throw new Error('Not authenticated')
  if (!/^\d{4}$/.test(nextPassword)) throw new Error('Password must be exactly 4 digits')

  if (isSupabaseEmployeesEnabled()) {
    const me = await employeeMe()
    if (!me) throw new Error('Employee not found')
    const stored = me.password ?? '1234'
    if (stored !== currentPassword) throw new Error('Current password is incorrect')
    await supabaseEmployeesRequest<SupabaseEmployeeRow[]>(
      `employees?id=eq.${encodeURIComponent(raw.employeeId)}&select=*`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(toSupabaseEmployeePatch({ password: nextPassword })),
      },
    )
    return
  }

  const all = readJson<Employee[]>(LS.employees, employees as Employee[])
  const idx = all.findIndex((e) => e.id === raw.employeeId)
  if (idx < 0) throw new Error('Employee not found')
  const cur = all[idx]
  const stored = cur.password ?? '1234'
  if (stored !== currentPassword) throw new Error('Current password is incorrect')

  const next = all.slice()
  next[idx] = { ...cur, password: nextPassword }
  writeJson(LS.employees, next)
}

export async function listProjects(): Promise<Project[]> {
  if (!USE_MOCK) throw new Error('TODO: real backend listProjects()')
  ensureSeeded()
  return readJson<Project[]>(LS.projects, projects as Project[])
}

export async function getProject(projectId: string): Promise<Project | null> {
  const all = (await listProjects()) as Project[]
  return all.find((p) => p.id === projectId) ?? null
}

export async function listClients(): Promise<Client[]> {
  if (!USE_MOCK) throw new Error('TODO: real backend listClients()')
  ensureSeeded()
  return readJson<Client[]>(LS.clients, clients as Client[])
}

export async function listEmployees(): Promise<Employee[]> {
  if (!isSupabaseEmployeesEnabled() && !USE_MOCK) throw new Error('TODO: real backend listEmployees()')
  if (isSupabaseEmployeesEnabled()) {
    const rows = await supabaseEmployeesRequest<SupabaseEmployeeRow[]>('employees?select=*&order=name.asc')
    return rows.map(mapSupabaseEmployee)
  }
  ensureSeeded()
  const all = readJson<Employee[]>(LS.employees, employees as Employee[])
  let changed = false
  const normalized = all.map((e) => {
    const username = defaultEmployeeUsername(e)
    const password = (e.password ?? '1234').trim() || '1234'
    const active = typeof e.active === 'boolean' ? e.active : !e.archivedAt
    const archivedAt = e.archivedAt ?? null
    if (e.username === username && e.password === password && e.active === active && e.archivedAt === archivedAt) {
      return e
    }
    changed = true
    return { ...e, username, password, active, archivedAt }
  })
  if (changed) writeJson(LS.employees, normalized)
  return normalized
}

export async function createEmployee(input: {
  name: string
  role: EmployeeRole
  username?: string
  password?: string
  phone?: string
  email?: string
}): Promise<Employee> {
  if (!isSupabaseEmployeesEnabled() && !USE_MOCK) throw new Error('TODO: real backend createEmployee()')
  if (USE_MOCK) ensureSeeded()
  if (isSupabaseEmployeesEnabled()) {
    const id = `emp_${crypto.randomUUID()}`
    const base: Employee = {
      id,
      name: input.name.trim(),
      role: input.role,
      username: input.username ?? '',
      password: (input.password ?? '1234').trim() || '1234',
      phone: input.phone ?? '',
      email: input.email ?? '',
      active: true,
      archivedAt: null,
    }
    const payload = toSupabaseEmployeePatch({
      id: base.id,
      name: base.name,
      role: base.role,
      username: defaultEmployeeUsername(base),
      password: base.password,
      phone: base.phone,
      email: base.email,
      active: true,
      archivedAt: null,
    })
    const rows = await supabaseEmployeesRequest<SupabaseEmployeeRow[]>('employees?select=*', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    })
    if (!rows.length) throw new Error('Unable to create employee')
    return mapSupabaseEmployee(rows[0])
  }
  const all = await listEmployees()
  const id = `emp_${crypto.randomUUID()}`
  const next: Employee = {
    id,
    name: input.name,
    role: input.role,
    username: defaultEmployeeUsername({
      id,
      name: input.name,
      email: input.email ?? '',
      phone: input.phone ?? '',
      username: input.username ?? '',
    }),
    password: (input.password ?? '1234').trim() || '1234',
    phone: input.phone ?? '',
    email: input.email ?? '',
    active: true,
    archivedAt: null,
  }
  writeJson(LS.employees, [next, ...all])
  return next
}

export async function updateEmployee(input: {
  id: string
  name: string
  role: EmployeeRole
  username?: string
  password?: string
  phone?: string
  email?: string
}): Promise<Employee> {
  if (!isSupabaseEmployeesEnabled() && !USE_MOCK) throw new Error('TODO: real backend updateEmployee()')
  if (USE_MOCK) ensureSeeded()
  if (isSupabaseEmployeesEnabled()) {
    const existing = (await listEmployees()).find((e) => e.id === input.id) ?? null
    const normalized = {
      id: input.id,
      name: input.name.trim(),
      role: input.role,
      username: defaultEmployeeUsername({
        id: input.id,
        name: input.name.trim(),
        email: input.email ?? existing?.email ?? '',
        phone: input.phone ?? '',
        username: input.username ?? existing?.username ?? '',
      }),
      password: (input.password ?? existing?.password ?? '1234').trim() || '1234',
      phone: input.phone ?? '',
      email: input.email ?? '',
    }
    const rows = await supabaseEmployeesRequest<SupabaseEmployeeRow[]>(
      `employees?id=eq.${encodeURIComponent(input.id)}&select=*`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(
          toSupabaseEmployeePatch({
            name: normalized.name,
            role: normalized.role,
            username: normalized.username,
            password: normalized.password,
            phone: normalized.phone,
            email: normalized.email,
          }),
        ),
      },
    )
    if (!rows.length) throw new Error('Employee not found')
    return mapSupabaseEmployee(rows[0])
  }
  const all = await listEmployees()
  const idx = all.findIndex((e) => e.id === input.id)
  if (idx < 0) throw new Error('Employee not found')
  const cur = all[idx]
  const nextEmp: Employee = {
    ...cur,
    name: input.name.trim(),
    role: input.role,
    username: defaultEmployeeUsername({
      id: cur.id,
      name: input.name.trim(),
      email: input.email ?? cur.email ?? '',
      phone: input.phone ?? '',
      username: input.username ?? cur.username ?? '',
    }),
    password: (input.password ?? cur.password ?? '1234').trim() || '1234',
    phone: input.phone ?? '',
    email: input.email ?? '',
  }
  const next = all.slice()
  next[idx] = nextEmp
  writeJson(LS.employees, next)
  return nextEmp
}

export async function archiveEmployee(employeeId: string): Promise<void> {
  if (!isSupabaseEmployeesEnabled() && !USE_MOCK) throw new Error('TODO: real backend archiveEmployee()')
  if (USE_MOCK) ensureSeeded()
  if (isSupabaseEmployeesEnabled()) {
    const now = new Date().toISOString()
    await supabaseEmployeesRequest<SupabaseEmployeeRow[]>(
      `employees?id=eq.${encodeURIComponent(employeeId)}&select=*`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(toSupabaseEmployeePatch({ active: false, archivedAt: now })),
      },
    )
    return
  }
  const all = await listEmployees()
  const now = new Date().toISOString()
  const next = all.map((e) => (e.id === employeeId ? { ...e, archivedAt: e.archivedAt ?? now, active: false } : e))
  writeJson(LS.employees, next)
}

export async function resetEmployeeCredentials(employeeId: string): Promise<void> {
  if (!isSupabaseEmployeesEnabled() && !USE_MOCK) throw new Error('TODO: real backend resetEmployeeCredentials()')
  if (USE_MOCK) ensureSeeded()
  if (isSupabaseEmployeesEnabled()) {
    const current = (await listEmployees()).find((e) => e.id === employeeId)
    if (!current) return
    const username = defaultEmployeeUsername(current)
    await supabaseEmployeesRequest<SupabaseEmployeeRow[]>(
      `employees?id=eq.${encodeURIComponent(employeeId)}&select=*`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(toSupabaseEmployeePatch({ username, password: '1234' })),
      },
    )
    return
  }
  const all = await listEmployees()
  const next = all.map((e) => {
    if (e.id !== employeeId) return e
    const username = (e.phone ?? '').trim()
    return {
      ...e,
      username,
      password: '1234',
    }
  })
  writeJson(LS.employees, next)
}

export async function getClient(clientId: string): Promise<Client | null> {
  const all = await listClients()
  return all.find((c) => c.id === clientId) ?? null
}

export async function createProject(input: {
  projectName: string
  clientId?: string
  clientName?: string
  clientAddress?: string
  clientPhone?: string
  clientEmail?: string
  jobAddress: string
  projectMeasurements?: string
  projectNotes?: string
  attachments?: ProjectAttachment[]
  status: ProjectStatus
  budgetTotal?: number
  revenue?: number
}): Promise<Project> {
  if (!USE_MOCK) throw new Error('TODO: real backend createProject()')
  ensureSeeded()

  const allClients = readJson<Client[]>(LS.clients, clients as Client[])
  const usingExisting = Boolean(input.clientId)
  const clientId = input.clientId ?? `cli_${crypto.randomUUID()}`
  const newClient: Client = usingExisting
    ? (allClients.find((c) => c.id === input.clientId) ?? {
        id: clientId,
        name: input.clientName ?? 'Unknown',
        address: input.clientAddress ?? '',
        phone: input.clientPhone ?? '',
        email: input.clientEmail ?? '',
      })
    : {
        id: clientId,
        name: input.clientName ?? 'New customer',
        address: input.clientAddress ?? '',
        phone: input.clientPhone ?? '',
        email: input.clientEmail ?? '',
      }

  const allProjects = readJson<Project[]>(LS.projects, projects as Project[])
  const today = new Date().toISOString().slice(0, 10)
  const next: Project = {
    id: `proj_${crypto.randomUUID()}`,
    name: input.projectName,
    clientId: newClient.id,
    status: input.status,
    jobAddress: input.jobAddress,
    jobPhone: '',
    apptDate: today,
    budgetTotal: input.budgetTotal ?? 0,
    revenue: input.revenue ?? 0,
    customerPaid: 0,
    reminder: '',
    archivedAt: null,
    measurements: input.projectMeasurements ?? '',
    notes: input.projectNotes ?? '',
    attachments: input.attachments ?? [],
    timeline: [
      {
        id: `tl_${crypto.randomUUID()}`,
        at: today,
        title: 'Project created',
        status: 'Done',
        notes: '',
      },
    ],
  }

  if (!usingExisting) {
    writeJson(LS.clients, [newClient, ...allClients])
  }
  writeJson(LS.projects, [next, ...allProjects])
  return next
}

export async function archiveProject(projectId: string): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend archiveProject()')
  ensureSeeded()
  const all = readJson<Project[]>(LS.projects, projects as Project[])
  const now = new Date().toISOString()
  const next = all.map((p) =>
    p.id === projectId ? { ...p, archivedAt: p.archivedAt ?? now } : p,
  )
  writeJson(LS.projects, next)
}

export async function recordProjectDeposit(projectId: string, amount: number): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend recordProjectDeposit()')
  ensureSeeded()
  const all = readJson<Project[]>(LS.projects, projects as Project[])
  const now = new Date().toISOString()
  const at = now.slice(0, 10)
  const next = all.map((p) => {
    if (p.id !== projectId) return p
    const prev = p.depositAmount ?? 0
    const add = Number.isFinite(amount) ? amount : 0
    const depositAmount = Math.max(0, prev + add)
    const updated: Project = {
      ...p,
      depositReceivedAt: p.depositReceivedAt ?? now,
      depositAmount,
      customerPaid: Math.max(0, (p.customerPaid ?? 0) + add),
    }
    return appendTimelineEvent(updated, {
      id: `tl_${crypto.randomUUID()}`,
      at,
      title: `Deposit received (${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(add)})`,
      status: 'Done',
      notes: '',
    })
  })
  writeJson(LS.projects, next)
}

export async function proposeProjectStartDate(projectId: string, date: string): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend proposeProjectStartDate()')
  ensureSeeded()
  const all = readJson<Project[]>(LS.projects, projects as Project[])
  const now = new Date().toISOString()
  const at = now.slice(0, 10)
  const next = all.map((p) =>
    p.id === projectId
      ? appendTimelineEvent(
          {
            ...p,
            startDateProposed: date,
            startDateProposedAt: now,
            startDateApprovedAt: null,
          },
          {
            id: `tl_${crypto.randomUUID()}`,
            at,
            title: `Start date proposed: ${date}`,
            status: 'Done',
            notes: '',
          },
        )
      : p,
  )
  writeJson(LS.projects, next)
}

export async function approveProjectStartDate(projectId: string): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend approveProjectStartDate()')
  ensureSeeded()
  const all = readJson<Project[]>(LS.projects, projects as Project[])
  const now = new Date().toISOString()
  const at = now.slice(0, 10)
  const next = all.map((p) =>
    p.id === projectId
      ? appendTimelineEvent(
          { ...p, startDateApprovedAt: now },
          { id: `tl_${crypto.randomUUID()}`, at, title: 'Start date approved', status: 'Done', notes: '' },
        )
      : p,
  )
  writeJson(LS.projects, next)
}

export async function addProjectTimelineEvent(
  projectId: string,
  input: { at: string; title: string; status: ProjectTimelineStatus; notes?: string },
): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend addProjectTimelineEvent()')
  ensureSeeded()
  const all = readJson<Project[]>(LS.projects, projects as Project[])
  const next = all.map((p) => {
    if (p.id !== projectId) return p
    const existing = p.timeline ?? []
    const ev: ProjectTimelineEvent = {
      id: `tl_${crypto.randomUUID()}`,
      at: input.at,
      title: input.title,
      status: input.status,
      notes: input.notes ?? '',
    }
    return { ...p, timeline: [ev, ...existing] }
  })
  writeJson(LS.projects, next)
}

export async function setProjectTimelineStatus(
  projectId: string,
  eventId: string,
  status: ProjectTimelineStatus,
): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend setProjectTimelineStatus()')
  ensureSeeded()
  const all = readJson<Project[]>(LS.projects, projects as Project[])
  const next = all.map((p) => {
    if (p.id !== projectId) return p
    const existing = p.timeline ?? []
    const updated = existing.map((ev) => (ev.id === eventId ? { ...ev, status } : ev))
    return { ...p, timeline: updated }
  })
  writeJson(LS.projects, next)
}

export async function replaceProjectTimeline(
  projectId: string,
  events: Array<{ at: string; title: string; status: ProjectTimelineStatus; notes?: string }>,
): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend replaceProjectTimeline()')
  ensureSeeded()
  const all = readJson<Project[]>(LS.projects, projects as Project[])
  const next = all.map((p) => {
    if (p.id !== projectId) return p
    const timeline: ProjectTimelineEvent[] = events.map((ev) => ({
      id: `tl_${crypto.randomUUID()}`,
      at: ev.at,
      title: ev.title,
      status: ev.status,
      notes: ev.notes ?? '',
    }))
    return { ...p, timeline }
  })
  writeJson(LS.projects, next)
}

export async function listInvoices(projectId: string): Promise<Invoice[]> {
  if (!USE_MOCK) throw new Error('TODO: real backend listInvoices()')
  ensureSeeded()
  const all = readJson<Invoice[]>(LS.invoices, invoices as Invoice[])
  return all.filter((i) => i.projectId === projectId)
}

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  if (!USE_MOCK) throw new Error('TODO: real backend getInvoice()')
  ensureSeeded()
  const all = readJson<Invoice[]>(LS.invoices, invoices as Invoice[])
  return all.find((i) => i.id === invoiceId) ?? null
}

export async function saveInvoice(updated: Invoice): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend saveInvoice()')
  ensureSeeded()
  const all = readJson<Invoice[]>(LS.invoices, invoices as Invoice[])
  const next = all.map((i) => (i.id === updated.id ? updated : i))
  writeJson(LS.invoices, next)
}

export async function markInvoiceSent(invoiceId: string): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend markInvoiceSent()')
  ensureSeeded()
  const all = readJson<Invoice[]>(LS.invoices, invoices as Invoice[])
  const now = new Date().toISOString()
  const next = all.map((i) =>
    i.id === invoiceId ? { ...i, status: 'Sent', sentAt: i.sentAt ?? now } : i,
  )
  writeJson(LS.invoices, next)

  const inv = next.find((x) => x.id === invoiceId)
  if (!inv) return
  const allProjects = readJson<Project[]>(LS.projects, projects as Project[])
  const at = now.slice(0, 10)
  const nextProjects = allProjects.map((p) =>
    p.id === inv.projectId
      ? appendTimelineEvent(p, {
          id: `tl_${crypto.randomUUID()}`,
          at,
          title: `Quote sent (Estimate #${inv.invoiceNo})`,
          status: 'Done',
          notes: 'TODO: Email/WhatsApp integration.',
        })
      : p,
  )
  writeJson(LS.projects, nextProjects)
}

export async function markInvoiceClientApproved(invoiceId: string): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend markInvoiceClientApproved()')
  ensureSeeded()
  const all = readJson<Invoice[]>(LS.invoices, invoices as Invoice[])
  const now = new Date().toISOString()
  const next = all.map((i) =>
    i.id === invoiceId ? { ...i, clientApprovedAt: i.clientApprovedAt ?? now } : i,
  )
  writeJson(LS.invoices, next)

  const inv = next.find((x) => x.id === invoiceId)
  if (!inv) return
  const allProjects = readJson<Project[]>(LS.projects, projects as Project[])
  const at = now.slice(0, 10)
  const nextProjects = allProjects.map((p) =>
    p.id === inv.projectId
      ? appendTimelineEvent(p, {
          id: `tl_${crypto.randomUUID()}`,
          at,
          title: `Quote approved (Estimate #${inv.invoiceNo})`,
          status: 'Done',
          notes: '',
        })
      : p,
  )
  writeJson(LS.projects, nextProjects)
}

export async function createEstimate(projectId: string): Promise<Invoice> {
  if (!USE_MOCK) throw new Error('TODO: real backend createEstimate()')
  ensureSeeded()
  const all = readJson<Invoice[]>(LS.invoices, invoices as Invoice[])
  const now = new Date().toISOString()
  const at = now.slice(0, 10)
  const next: Invoice = {
    id: `inv_${crypto.randomUUID()}`,
    projectId,
    invoiceNo: String(300 + all.length + 1),
    type: 'Estimate',
    status: 'Draft',
    sentAt: null,
    clientApprovedAt: null,
    salesperson: 'Celso Legra',
    job: 'New estimate',
    shippingMethod: 'N/A',
    shippingTerms: 'N/A',
    deliveryDate: at,
    paymentTerms: 'Per schedule',
    dueDate: at,
    discount: 0,
  }
  writeJson(LS.invoices, [next, ...all])
  writeJson(LS.invoiceItems, [
    { id: `item_${crypto.randomUUID()}`, invoiceId: next.id, qty: 1, itemNo: '001', description: 'New line item', unitPrice: 0 },
    ...readJson<InvoiceItem[]>(LS.invoiceItems, invoiceItems as InvoiceItem[]),
  ])
  writeJson(LS.payments, [
    { invoiceId: next.id, downPayment: 0, secondPayment: 0, thirdPayment: 0, finalPayment: 0 },
    ...readJson<PaymentSchedule[]>(LS.payments, payments as PaymentSchedule[]),
  ])

  const allProjects = readJson<Project[]>(LS.projects, projects as Project[])
  const nextProjects = allProjects.map((p) =>
    p.id === projectId
      ? appendTimelineEvent(p, {
          id: `tl_${crypto.randomUUID()}`,
          at,
          title: `Quote created (Estimate #${next.invoiceNo})`,
          status: 'Done',
          notes: '',
        })
      : p,
  )
  writeJson(LS.projects, nextProjects)

  return next
}

export async function listInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  if (!USE_MOCK) throw new Error('TODO: real backend listInvoiceItems()')
  ensureSeeded()
  const all = readJson<InvoiceItem[]>(LS.invoiceItems, invoiceItems as InvoiceItem[])
  return all.filter((it) => it.invoiceId === invoiceId)
}

export async function saveInvoiceItems(invoiceId: string, items: InvoiceItem[]): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend saveInvoiceItems()')
  ensureSeeded()
  const all = readJson<InvoiceItem[]>(LS.invoiceItems, invoiceItems as InvoiceItem[])
  const kept = all.filter((it) => it.invoiceId !== invoiceId)
  writeJson(LS.invoiceItems, [...kept, ...items])
}

export async function getPaymentSchedule(invoiceId: string): Promise<PaymentSchedule | null> {
  if (!USE_MOCK) throw new Error('TODO: real backend getPaymentSchedule()')
  ensureSeeded()
  const all = readJson<PaymentSchedule[]>(LS.payments, payments as PaymentSchedule[])
  return all.find((p) => p.invoiceId === invoiceId) ?? null
}

export async function savePaymentSchedule(schedule: PaymentSchedule): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend savePaymentSchedule()')
  ensureSeeded()
  const all = readJson<PaymentSchedule[]>(LS.payments, payments as PaymentSchedule[])
  const next = all.filter((p) => p.invoiceId !== schedule.invoiceId)
  writeJson(LS.payments, [...next, schedule])
}

export async function getLedger(projectId: string): Promise<LedgerDoc | null> {
  if (!USE_MOCK) throw new Error('TODO: real backend getLedger()')
  ensureSeeded()
  const all = readJson<LedgerDoc[]>(LS.ledger, ledger as LedgerDoc[])
  return all.find((l) => l.projectId === projectId) ?? null
}

export async function saveLedger(doc: LedgerDoc): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend saveLedger()')
  ensureSeeded()
  const all = readJson<LedgerDoc[]>(LS.ledger, ledger as LedgerDoc[])
  const next = all.filter((l) => l.projectId !== doc.projectId)
  writeJson(LS.ledger, [...next, doc])
}

export async function listWorkOrders(projectId: string): Promise<WorkOrder[]> {
  if (!isSupabaseWorkOrdersEnabled() && !USE_MOCK) throw new Error('TODO: real backend listWorkOrders()')
  if (isSupabaseWorkOrdersEnabled()) {
    const rows = await supabaseEmployeesRequest<SupabaseWorkOrderRow[]>(
      `workorders?select=*&project_id=eq.${encodeURIComponent(projectId)}&order=start_date.asc`,
    )
    return rows.map(mapSupabaseWorkOrder)
  }
  ensureSeeded()
  const all = readJson<WorkOrder[]>(LS.workorders, workorders as WorkOrder[])
  return all.filter((w) => w.projectId === projectId).map(normalizeWorkOrder)
}

export async function listAllWorkOrders(): Promise<WorkOrder[]> {
  if (!isSupabaseWorkOrdersEnabled() && !USE_MOCK) throw new Error('TODO: real backend listAllWorkOrders()')
  if (isSupabaseWorkOrdersEnabled()) {
    const rows = await supabaseEmployeesRequest<SupabaseWorkOrderRow[]>('workorders?select=*&order=start_date.asc')
    return rows.map(mapSupabaseWorkOrder)
  }
  ensureSeeded()
  return readJson<WorkOrder[]>(LS.workorders, workorders as WorkOrder[]).map(normalizeWorkOrder)
}

export async function listEmployeeWorkOrders(employeeId: string): Promise<WorkOrder[]> {
  if (!isSupabaseWorkOrdersEnabled() && !USE_MOCK) throw new Error('TODO: real backend listEmployeeWorkOrders()')
  const all = await listAllWorkOrders()
  const me = await listEmployees().then((xs) => xs.find((e) => e.id === employeeId) ?? null).catch(() => null)
  const normalizedEmployeeId = normalizeIdentifierCompact(employeeId)
  const byId = (w: WorkOrder) =>
    collectAssigneeTokens(w.assignedTo).some((x) => normalizeIdentifierCompact(String(x)) === normalizedEmployeeId)
  const byNameOrIdentifier = (w: WorkOrder) => {
    if (!me) return false
    const assignedTokens = collectAssigneeTokens(w.assignedTo)
    const assignedCompact = assignedTokens.map((x) => normalizeIdentifierCompact(String(x))).filter(Boolean)
    const assignedLoose = assignedTokens.map((x) => normalizeIdentifierLoose(String(x))).filter(Boolean)
    const candidates = [
      me.id,
      me.name,
      me.username ?? '',
      me.phone ?? '',
      me.email ?? '',
    ]
      .map((x) => String(x))
      .filter((x) => x.trim().length > 0)

    return candidates.some((raw) => {
      const compact = normalizeIdentifierCompact(raw)
      const loose = normalizeIdentifierLoose(raw)
      if (!compact && !loose) return false
      if (compact && assignedCompact.includes(compact)) return true
      if (loose && assignedLoose.includes(loose)) return true
      return assignedLoose.some((a) => (loose && (a.includes(loose) || loose.includes(a))))
    })
  }
  return all.filter((w) => byId(w) || byNameOrIdentifier(w))
}

export async function listProjectMaterials(projectId: string): Promise<ProjectMaterial[]> {
  if (!USE_MOCK) throw new Error('TODO: real backend listProjectMaterials()')
  ensureSeeded()
  const all = readJson<ProjectMaterial[]>(LS.projectMaterials, [])
  return all.filter((m) => m.projectId === projectId)
}

export async function syncProjectMaterialsFromLatestEstimate(projectId: string): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend syncProjectMaterialsFromLatestEstimate()')
  ensureSeeded()
  const invs = await listInvoices(projectId)
  const estimates = invs.filter((i) => i.type === 'Estimate')
  const pick =
    estimates
      .slice()
      .sort((a, b) => String(a.invoiceNo).localeCompare(String(b.invoiceNo)))
      .at(-1) ?? null
  if (!pick) return
  const items = await listInvoiceItems(pick.id)
  const all = readJson<ProjectMaterial[]>(LS.projectMaterials, [])
  const kept = all.filter((m) => m.projectId !== projectId)
  const next: ProjectMaterial[] = []
  const allLabor = readJson<LaborEntry[]>(LS.labor, [])
  const laborKept = allLabor.filter(
    (x) => !(x.projectId === projectId && (x.notes ?? '').includes('[QUOTE_PACKAGE_COMPONENT]')),
  )
  const laborFromQuote: LaborEntry[] = []

  for (const it of items) {
    const d = (it.description ?? '').trim()
    // Package header lines stay only in the quote printout and are ignored in financial materials.
    if (d.startsWith('Package:')) continue

    if (d.startsWith('[PKGCOMP-MATERIAL]')) {
      const invMatch = d.match(/\| INV:([^\s|]+)/)
      const cleanName = d
        .replace(/^\[PKGCOMP-MATERIAL\]\s*/i, '')
        .replace(/\s*\|\s*INV:[^\s|]+/i, '')
        .trim()
      next.push({
        id: `pm_${crypto.randomUUID()}`,
        projectId,
        source: 'Quote',
        name: `${it.itemNo} ${cleanName}`.trim(),
        sku: it.itemNo,
        qty: it.qty,
        unitCostEstimate: it.unitPrice,
        purchased: false,
        purchasedAt: null,
        purchasedCost: 0,
        supplierId: null,
        inventoryItemId: invMatch?.[1] ?? null,
      })
      continue
    }

    if (d.startsWith('[PKGCOMP-LABOR]')) {
      const cleanProcess = d.replace(/^\[PKGCOMP-LABOR\]\s*/i, '').trim()
      laborFromQuote.push({
        id: `lab_${crypto.randomUUID()}`,
        projectId,
        date: new Date().toISOString().slice(0, 10),
        process: cleanProcess,
        hours: Math.max(0, Number(it.qty) || 0),
        rate: Math.max(0, Number(it.unitPrice) || 0),
        notes: '[QUOTE_PACKAGE_COMPONENT]',
      })
      continue
    }

    next.push({
      id: `pm_${crypto.randomUUID()}`,
      projectId,
      source: 'Quote',
      name: `${it.itemNo} ${it.description}`.trim(),
      sku: it.itemNo,
      qty: it.qty,
      unitCostEstimate: it.unitPrice,
      purchased: false,
      purchasedAt: null,
      purchasedCost: 0,
      supplierId: null,
    })
  }
  writeJson(LS.projectMaterials, [...next, ...kept])
  writeJson(LS.labor, [...laborFromQuote, ...laborKept])
}

export async function updateProjectMaterial(updated: ProjectMaterial): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend updateProjectMaterial()')
  ensureSeeded()
  const all = readJson<ProjectMaterial[]>(LS.projectMaterials, [])
  const next = all.map((m) => (m.id === updated.id ? updated : m))
  writeJson(LS.projectMaterials, next)
}

export async function addProjectMaterial(input: {
  projectId: string
  name: string
  sku?: string
  qty: number
  unitCostEstimate: number
}): Promise<ProjectMaterial> {
  if (!USE_MOCK) throw new Error('TODO: real backend addProjectMaterial()')
  ensureSeeded()
  const all = readJson<ProjectMaterial[]>(LS.projectMaterials, [])
  const next: ProjectMaterial = {
    id: `pm_${crypto.randomUUID()}`,
    projectId: input.projectId,
    source: 'Manual',
    name: input.name,
    sku: input.sku ?? '',
    qty: Math.max(0, Number(input.qty) || 0),
    unitCostEstimate: Math.max(0, Number(input.unitCostEstimate) || 0),
    purchased: false,
    purchasedAt: null,
    purchasedCost: 0,
    supplierId: null,
  }
  writeJson(LS.projectMaterials, [next, ...all])
  return next
}

export async function addLaborEntry(input: Omit<LaborEntry, 'id'>): Promise<LaborEntry> {
  if (!USE_MOCK) throw new Error('TODO: real backend addLaborEntry()')
  ensureSeeded()
  const all = readJson<LaborEntry[]>(LS.labor, [])
  const next: LaborEntry = { ...input, id: `lab_${crypto.randomUUID()}` }
  writeJson(LS.labor, [next, ...all])
  return next
}

export async function updateLaborEntry(updated: LaborEntry): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend updateLaborEntry()')
  ensureSeeded()
  const all = readJson<LaborEntry[]>(LS.labor, [])
  const next = all.map((x) => (x.id === updated.id ? updated : x))
  writeJson(LS.labor, next)
}

export async function listLaborEntries(projectId: string): Promise<LaborEntry[]> {
  if (!USE_MOCK) throw new Error('TODO: real backend listLaborEntries()')
  ensureSeeded()
  const all = readJson<LaborEntry[]>(LS.labor, [])
  return all.filter((x) => x.projectId === projectId)
}

export async function deleteLaborEntry(id: string): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend deleteLaborEntry()')
  ensureSeeded()
  const all = readJson<LaborEntry[]>(LS.labor, [])
  writeJson(LS.labor, all.filter((x) => x.id !== id))
}

export async function getWorkOrder(workOrderId: string): Promise<WorkOrder | null> {
  if (!isSupabaseWorkOrdersEnabled() && !USE_MOCK) throw new Error('TODO: real backend getWorkOrder()')
  if (isSupabaseWorkOrdersEnabled()) {
    const rows = await supabaseEmployeesRequest<SupabaseWorkOrderRow[]>(
      `workorders?select=*&id=eq.${encodeURIComponent(workOrderId)}&limit=1`,
    )
    return rows.length ? mapSupabaseWorkOrder(rows[0]) : null
  }
  ensureSeeded()
  const all = readJson<WorkOrder[]>(LS.workorders, workorders as WorkOrder[])
  const found = all.find((w) => w.id === workOrderId) ?? null
  return found ? normalizeWorkOrder(found) : null
}

export async function saveWorkOrder(order: WorkOrder): Promise<void> {
  if (!isSupabaseWorkOrdersEnabled() && !USE_MOCK) throw new Error('TODO: real backend saveWorkOrder()')
  if (isSupabaseWorkOrdersEnabled()) {
    await supabaseEmployeesRequest<SupabaseWorkOrderRow[]>(
      `workorders?id=eq.${encodeURIComponent(order.id)}&select=*`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(toSupabaseWorkOrderPatch(normalizeWorkOrder(order))),
      },
    )
    return
  }
  ensureSeeded()
  const all = readJson<WorkOrder[]>(LS.workorders, workorders as WorkOrder[])
  const normalized = normalizeWorkOrder(order)
  const next = all.map((w) => (w.id === normalized.id ? normalized : w))
  writeJson(LS.workorders, next)
}

export async function createWorkOrder(projectId: string): Promise<WorkOrder> {
  if (!isSupabaseWorkOrdersEnabled() && !USE_MOCK) throw new Error('TODO: real backend createWorkOrder()')
  if (USE_MOCK) ensureSeeded()
  const now = new Date()
  const start = now.toISOString().slice(0, 10)
  const end = new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10)
  const next: WorkOrder = {
    id: `wo_${crypto.randomUUID()}`,
    projectId,
    title: 'New Work Order',
    status: 'Not Started',
    priority: 'Medium',
    startDate: start,
    endDate: end,
    assignedTo: [],
    checklist: [{ id: `c_${crypto.randomUUID()}`, text: 'First task', done: false }],
    notes: [],
    media: [],
    requests: [],
  }
  if (isSupabaseWorkOrdersEnabled()) {
    const rows = await supabaseEmployeesRequest<SupabaseWorkOrderRow[]>('workorders?select=*', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(toSupabaseWorkOrderPatch(next)),
    })
    if (!rows.length) throw new Error('Unable to create work order')
    return mapSupabaseWorkOrder(rows[0])
  }
  const all = readJson<WorkOrder[]>(LS.workorders, workorders as WorkOrder[])
  writeJson(LS.workorders, [next, ...all])
  return next
}

export async function createWeeklyWorkOrders(projectId: string, startDate: string, weeks: number): Promise<WorkOrder[]> {
  if (!isSupabaseWorkOrdersEnabled() && !USE_MOCK) throw new Error('TODO: real backend createWeeklyWorkOrders()')
  if (USE_MOCK) ensureSeeded()

  const base = new Date(`${startDate}T00:00:00`)
  const count = Math.max(1, Math.min(12, Math.trunc(weeks)))
  const created: WorkOrder[] = []

  for (let i = 0; i < count; i++) {
    const start = new Date(base.getTime() + i * 7 * 86400000)
    const end = new Date(start.getTime() + 6 * 86400000)
    const s = start.toISOString().slice(0, 10)
    const e = end.toISOString().slice(0, 10)
    const title = `Week of ${s}`
    const wo: WorkOrder = {
      id: `wo_${crypto.randomUUID()}`,
      projectId,
      title,
      status: 'Not Started',
      priority: 'Medium',
      startDate: s,
      endDate: e,
      assignedTo: [],
      checklist: [
        { id: `c_${crypto.randomUUID()}`, text: 'Plan tasks for the week', done: false },
        { id: `c_${crypto.randomUUID()}`, text: 'Confirm materials/tools on site', done: false },
      ],
      notes: [],
      media: [],
      requests: [],
    }
    created.push(wo)
  }

  if (isSupabaseWorkOrdersEnabled()) {
    if (!created.length) return []
    const rows = await supabaseEmployeesRequest<SupabaseWorkOrderRow[]>('workorders?select=*', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(created.map(toSupabaseWorkOrderPatch)),
    })
    return rows.map(mapSupabaseWorkOrder)
  }

  const all = readJson<WorkOrder[]>(LS.workorders, workorders as WorkOrder[])
  writeJson(LS.workorders, [...created, ...all])
  return created
}

export async function generateWeeklyWorkOrdersFromStartDate(
  projectId: string,
  startDate: string,
  weeks: number,
): Promise<WorkOrder[]> {
  if (!isSupabaseWorkOrdersEnabled() && !USE_MOCK) throw new Error('TODO: real backend generateWeeklyWorkOrdersFromStartDate()')
  if (USE_MOCK) ensureSeeded()

  const all = await listAllWorkOrders()
  const projAll = readJson<Project[]>(LS.projects, projects as Project[])
  const proj = projAll.find((p) => p.id === projectId) ?? null
  const tl = (proj?.timeline ?? []).slice()

  const base = new Date(`${startDate}T00:00:00`)
  if (Number.isNaN(base.getTime())) throw new Error('Invalid startDate')

  const count = Math.max(1, Math.min(26, Math.trunc(weeks)))
  const created: WorkOrder[] = []

  // Avoid duplicates if the user clicks multiple times.
  const existingTitles = new Set(all.filter((w) => w.projectId === projectId).map((w) => w.title))

  function inRange(d: string, start: string, end: string) {
    return d >= start && d <= end
  }

  for (let i = 0; i < count; i++) {
    const start = new Date(base.getTime() + i * 7 * 86400000)
    const end = new Date(start.getTime() + 6 * 86400000)
    const s = start.toISOString().slice(0, 10)
    const e = end.toISOString().slice(0, 10)
    const title = `Week of ${s}`
    if (existingTitles.has(title)) continue

    const milestoneTasks = tl
      .filter((ev) => typeof ev.at === 'string' && inRange(ev.at, s, e))
      .map((ev) => `Milestone: ${ev.title}`)

    const checklist: WorkOrderChecklistItem[] = [
      { id: `c_${crypto.randomUUID()}`, text: 'Plan tasks for the week', done: false },
      { id: `c_${crypto.randomUUID()}`, text: 'Confirm materials/tools on site', done: false },
      ...milestoneTasks.map((text) => ({ id: `c_${crypto.randomUUID()}`, text, done: false })),
    ]

    const wo: WorkOrder = {
      id: `wo_${crypto.randomUUID()}`,
      projectId,
      title,
      status: 'Not Started',
      priority: 'Medium',
      startDate: s,
      endDate: e,
      assignedTo: [],
      checklist,
      notes: [],
      media: [],
      requests: [],
    }
    created.push(wo)
    existingTitles.add(title)
  }

  if (!created.length) return []
  if (isSupabaseWorkOrdersEnabled()) {
    const rows = await supabaseEmployeesRequest<SupabaseWorkOrderRow[]>('workorders?select=*', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(created.map(toSupabaseWorkOrderPatch)),
    })
    return rows.map(mapSupabaseWorkOrder)
  }
  writeJson(LS.workorders, [...created, ...all])
  return created
}

export async function getRetailSnapshots(): Promise<RetailSnapshots> {
  if (!USE_MOCK) throw new Error('TODO: real backend getRetailSnapshots()')
  return retailSnapshots as RetailSnapshots
}

export async function listSuppliers(): Promise<Supplier[]> {
  if (!USE_MOCK) throw new Error('TODO: real backend listSuppliers()')
  ensureSeeded()
  return readJson<Supplier[]>(LS.suppliers, (retailSnapshots as RetailSnapshots).suppliers ?? [])
}

export async function createSupplier(input: {
  name: string
  phone?: string
  email?: string
  website?: string
  notes?: string
}): Promise<Supplier> {
  if (!USE_MOCK) throw new Error('TODO: real backend createSupplier()')
  ensureSeeded()
  const all = await listSuppliers()
  const next: Supplier = {
    id: `sup_${crypto.randomUUID()}`,
    name: input.name,
    phone: input.phone ?? '',
    email: input.email ?? '',
    website: input.website ?? '',
    notes: input.notes ?? '',
    archivedAt: null,
  }
  writeJson(LS.suppliers, [next, ...all])
  return next
}

export async function archiveSupplier(supplierId: string): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend archiveSupplier()')
  ensureSeeded()
  const all = await listSuppliers()
  const now = new Date().toISOString()
  const next = all.map((s) => (s.id === supplierId ? { ...s, archivedAt: s.archivedAt ?? now } : s))
  writeJson(LS.suppliers, next)
}

export async function listInventoryItems(): Promise<InventoryItem[]> {
  if (!USE_MOCK) throw new Error('TODO: real backend listInventoryItems()')
  ensureSeeded()
  return readJson<InventoryItem[]>(
    LS.inventoryItems,
    (retailSnapshots as RetailSnapshots).inventoryItems ?? [],
  )
}

export async function createInventoryItem(input: {
  type: InventoryItemType
  category?: string
  name: string
  sku?: string
  unit: string
  supplierId?: string | null
  unitCost: number
  qtyOnHand: number
  reorderPoint: number
  reorderQty?: number
  notes?: string
}): Promise<InventoryItem> {
  if (!USE_MOCK) throw new Error('TODO: real backend createInventoryItem()')
  ensureSeeded()
  const all = await listInventoryItems()
  const next: InventoryItem = {
    id: `inv_${crypto.randomUUID()}`,
    type: input.type,
    category: input.category ?? '',
    name: input.name,
    sku: input.sku ?? '',
    unit: input.unit,
    supplierId: input.supplierId ?? null,
    unitCost: input.unitCost,
    qtyOnHand: input.qtyOnHand,
    reorderPoint: input.reorderPoint,
    reorderQty: input.reorderQty ?? 0,
    notes: input.notes ?? '',
    archivedAt: null,
  }
  writeJson(LS.inventoryItems, [next, ...all])
  return next
}

export async function updateInventoryItem(item: InventoryItem): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend updateInventoryItem()')
  ensureSeeded()
  const all = await listInventoryItems()
  const next = all.map((it) => (it.id === item.id ? item : it))
  writeJson(LS.inventoryItems, next)
}

export async function archiveInventoryItem(itemId: string): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend archiveInventoryItem()')
  ensureSeeded()
  const all = await listInventoryItems()
  const now = new Date().toISOString()
  const next = all.map((it) =>
    it.id === itemId ? { ...it, archivedAt: it.archivedAt ?? now } : it,
  )
  writeJson(LS.inventoryItems, next)
}

export async function adjustInventoryQty(itemId: string, delta: number): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend adjustInventoryQty()')
  ensureSeeded()
  const all = await listInventoryItems()
  const next = all.map((it) =>
    it.id === itemId ? { ...it, qtyOnHand: Math.max(0, (it.qtyOnHand ?? 0) + delta) } : it,
  )
  writeJson(LS.inventoryItems, next)
}

export async function listQuotePackages(): Promise<QuotePackage[]> {
  if (!USE_MOCK) throw new Error('TODO: real backend listQuotePackages()')
  ensureSeeded()
  const raw = readJson<QuotePackage[]>(LS.packages, packages as QuotePackage[])
  return raw.map((p) => ({
    ...p,
    items: (p.items ?? []).map((it) => ({
      ...it,
      kind: it.kind ?? 'Material',
      inventoryItemId: it.inventoryItemId ?? null,
    })),
  }))
}

export async function createQuotePackage(input: {
  name: string
  specifications?: string
  includes?: string
  items: Array<{
    itemNo: string
    description: string
    qty: number
    unitPrice: number
    kind?: 'Material' | 'Labor'
    inventoryItemId?: string | null
  }>
}): Promise<QuotePackage> {
  if (!USE_MOCK) throw new Error('TODO: real backend createQuotePackage()')
  ensureSeeded()
  const all = await listQuotePackages()
  const next: QuotePackage = {
    id: `pkg_${crypto.randomUUID()}`,
    name: input.name.trim(),
    specifications: input.specifications?.trim() ?? '',
    includes: input.includes?.trim() ?? '',
    items: input.items.map((it) => ({
      id: `pitem_${crypto.randomUUID()}`,
      itemNo: it.itemNo.trim(),
      description: it.description.trim(),
      qty: Number.isFinite(it.qty) ? Math.max(0, it.qty) : 0,
      unitPrice: Number.isFinite(it.unitPrice) ? Math.max(0, it.unitPrice) : 0,
      kind: it.kind ?? 'Material',
      inventoryItemId: it.inventoryItemId ?? null,
    })),
    archivedAt: null,
  }
  writeJson(LS.packages, [next, ...all])
  return next
}

export async function updateQuotePackage(updated: QuotePackage): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend updateQuotePackage()')
  ensureSeeded()
  const all = await listQuotePackages()
  const next = all.map((p) => (p.id === updated.id ? updated : p))
  writeJson(LS.packages, next)
}

export async function archiveQuotePackage(packageId: string): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend archiveQuotePackage()')
  ensureSeeded()
  const all = await listQuotePackages()
  const now = new Date().toISOString()
  const next = all.map((p) => (p.id === packageId ? { ...p, archivedAt: p.archivedAt ?? now } : p))
  writeJson(LS.packages, next)
}
