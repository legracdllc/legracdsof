import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { createWeeklyWorkOrders, createWorkOrder, listWorkOrders, type WorkOrder } from '../api/client'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { DataTable } from '../components/tables/DataTable'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/StatusBadge'

export function WorkOrdersListPage() {
  const nav = useNavigate()
  const { projectId } = useParams()
  const [orders, setOrders] = useState<WorkOrder[]>([])

  useEffect(() => {
    if (!projectId) return
    listWorkOrders(projectId).then(setOrders).catch(() => setOrders([]))
  }, [projectId])

  const cols = useMemo<ColumnDef<WorkOrder>[]>(
    () => [
      { header: 'Title', accessorKey: 'title' },
      { header: 'Start', accessorKey: 'startDate' },
      { header: 'End', accessorKey: 'endDate' },
      { header: 'Priority', accessorKey: 'priority' },
      {
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    [],
  )

  if (!projectId) return null

  return (
    <Card>
      <CardHeader
        title="Work Orders"
        subtitle="Daily/weekly work tracking "
        right={
          <div className="row" style={{ gap: 10 }}>
            <Button
              type="button"
              onClick={async () => {
                await createWeeklyWorkOrders(projectId, dayjs().format('YYYY-MM-DD'), 4)
                const next = await listWorkOrders(projectId)
                setOrders(next)
              }}
            >
              Generate 4 Weeks
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={async () => {
                const wo = await createWorkOrder(projectId)
                nav(`/projects/${projectId}/workorders/${wo.id}`)
              }}
            >
              Create 
            </Button>
          </div>
        }
      />
      <CardBody>
        <DataTable
          data={orders}
          columns={cols}
          onRowClick={(wo) => nav(`/projects/${projectId}/workorders/${wo.id}`)}
          emptyTitle="No work orders"
          emptyDescription="Create a work order to track tasks, notes, and media."
        />
      </CardBody>
    </Card>
  )
}
