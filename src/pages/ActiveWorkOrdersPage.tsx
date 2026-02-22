import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import {
  listProjects,
  listWorkOrders,
  saveWorkOrder,
  type Project,
  type WorkOrder,
  type WorkOrderStatus,
} from '../api/client'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { DataTable } from '../components/tables/DataTable'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { useLanguage } from '../i18n/LanguageProvider'

type ActiveWorkOrderRow = WorkOrder & {
  projectName: string
}

export function ActiveWorkOrdersPage() {
  const nav = useNavigate()
  const { tr } = useLanguage()
  const [rows, setRows] = useState<ActiveWorkOrderRow[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      const projects = await listProjects().catch(() => [] as Project[])
      const grouped = await Promise.all(
        projects.map(async (p) => ({
          project: p,
          workOrders: await listWorkOrders(p.id).catch(() => [] as WorkOrder[]),
        })),
      )

      if (!alive) return
      const next = grouped
        .flatMap(({ project, workOrders }) =>
          workOrders.map((wo) => ({
            ...wo,
            projectName: project.name,
          })),
        )
        .filter((wo) => wo.status !== 'Done')
        .sort((a, b) => `${a.startDate}-${a.title}`.localeCompare(`${b.startDate}-${b.title}`))

      setRows(next)
    }
    load().catch(() => setRows([]))
    return () => {
      alive = false
    }
  }, [])

  async function updateStatus(row: ActiveWorkOrderRow, next: WorkOrderStatus) {
    if (busyId === row.id) return
    setBusyId(row.id)
    try {
      const { projectName, ...base } = row
      await saveWorkOrder({ ...base, status: next })
      if (next === 'Done') {
        setRows((prev) => prev.filter((x) => x.id !== row.id))
      } else {
        setRows((prev) => prev.map((x) => (x.id === row.id ? { ...x, status: next } : x)))
      }
    } finally {
      setBusyId(null)
    }
  }

  const cols = useMemo<ColumnDef<ActiveWorkOrderRow>[]>(
    () => [
      { header: tr('Project'), accessorKey: 'projectName' },
      { header: 'Title', accessorKey: 'title' },
      { header: tr('Start'), accessorKey: 'startDate' },
      { header: tr('End'), accessorKey: 'endDate' },
      { header: tr('Priority'), accessorKey: 'priority' },
      { header: tr('Assigned'), cell: ({ row }) => row.original.assignedTo?.length ?? 0 },
      { header: tr('Status'), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        header: tr('Actions'),
        cell: ({ row }) => (
          <div className="row awActionsRow" style={{ gap: 8, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              variant="primary"
              onClick={() => nav(`/projects/${row.original.projectId}/workorders/${row.original.id}`)}
              style={{ minWidth: 92, whiteSpace: 'nowrap' }}
            >
              {tr('Open')}
            </Button>
            <Select
              className="awStatusSelect"
              value={row.original.status}
              disabled={busyId === row.original.id}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateStatus(row.original, e.target.value as WorkOrderStatus)}
              style={{ minWidth: 165, whiteSpace: 'nowrap' }}
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Done">Done</option>
            </Select>
            <Button
              type="button"
              variant="danger"
              disabled={busyId === row.original.id}
              style={{ minWidth: 110, whiteSpace: 'nowrap' }}
              onClick={() => updateStatus(row.original, 'Done')}
            >
              {tr('Close WO')}
            </Button>
          </div>
        ),
      },
    ],
    [busyId, nav, tr],
  )

  return (
    <Card>
      <CardHeader
        title={tr('Active Work Orders')}
        subtitle={tr('All non-completed work orders and current status')}
      />
      <CardBody>
        <DataTable
          data={rows}
          columns={cols}
          onRowClick={(wo) => nav(`/projects/${wo.projectId}/workorders/${wo.id}`)}
          emptyTitle={tr('No active work orders')}
          emptyDescription={tr('When work orders exist and are not Done, they will appear here.')}
        />
      </CardBody>
    </Card>
  )
}
