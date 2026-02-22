import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import {
  employeeChangePassword,
  employeeMe,
  listEmployeeWorkOrders,
  logout,
  type Employee,
  type WorkOrder,
} from '../api/client'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { DataTable } from '../components/tables/DataTable'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function EmployeeWorkOrdersPage() {
  const nav = useNavigate()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [isPhone, setIsPhone] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 560px)').matches : false,
  )
  const [pwdOpen, setPwdOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwdMsg, setPwdMsg] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(max-width: 560px)')
    const onChange = () => setIsPhone(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    let alive = true
    async function load() {
      const me = await employeeMe()
      if (!alive) return
      if (!me) {
        nav('/employee/login')
        return
      }
      setEmployee(me)
      const rows = await listEmployeeWorkOrders(me.id).catch(() => [] as WorkOrder[])
      if (!alive) return
      setOrders(rows.sort((a, b) => `${a.startDate}-${a.title}`.localeCompare(`${b.startDate}-${b.title}`)))
    }
    load()
    return () => {
      alive = false
    }
  }, [nav])

  const cols = useMemo<ColumnDef<WorkOrder>[]>(
    () => [
      { header: 'Title', accessorKey: 'title' },
      { header: 'Start', accessorKey: 'startDate' },
      ...(isPhone ? [] : ([{ header: 'End', accessorKey: 'endDate' }] as ColumnDef<WorkOrder>[])),
      ...(isPhone ? [] : ([{ header: 'Priority', accessorKey: 'priority' }] as ColumnDef<WorkOrder>[])),
      { header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    ],
    [isPhone],
  )

  return (
    <Card>
      <CardHeader
        title={employee ? `${employee.name} - Work Orders` : 'My Work Orders'}
        subtitle="Change status, request materials/tools, add notes and media"
        right={
          <div className="row" style={{ gap: 10 }}>
            <Button type="button" onClick={() => setPwdOpen((v) => !v)}>
              {pwdOpen ? 'Cancel Password Change' : 'Change Password'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                logout()
                nav('/employee/login')
              }}
            >
              Sign out
            </Button>
          </div>
        }
      />
      <CardBody>
        {pwdOpen ? (
          <div className="card" style={{ padding: 12, marginBottom: 12 }}>
            <div className="label" style={{ marginBottom: 8 }}>
              Change Password (4 digits)
            </div>
            <div className="grid2">
              <div className="field">
                <div className="label">Current password</div>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current 4-digit password"
                />
              </div>
              <div className="field">
                <div className="label">New password</div>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New 4-digit password"
                />
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
              <Button
                type="button"
                variant="primary"
                onClick={async () => {
                  setPwdMsg(null)
                  try {
                    await employeeChangePassword(currentPassword.trim(), newPassword.trim())
                    setPwdMsg('Password updated.')
                    setCurrentPassword('')
                    setNewPassword('')
                    setPwdOpen(false)
                  } catch (e) {
                    setPwdMsg(e instanceof Error ? e.message : 'Unable to update password')
                  }
                }}
                disabled={!currentPassword.trim() || !newPassword.trim()}
              >
                Save New Password
              </Button>
            </div>
            {pwdMsg ? <div className="help" style={{ marginTop: 8 }}>{pwdMsg}</div> : null}
          </div>
        ) : null}
        <DataTable
          data={orders}
          columns={cols}
          onRowClick={(wo) => nav(`/employee/workorders/${wo.id}`)}
          emptyTitle="No assigned work orders"
          emptyDescription="Assigned work orders will appear here."
        />
      </CardBody>
    </Card>
  )
}
