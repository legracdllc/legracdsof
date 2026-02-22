import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { createEstimate, listInvoices, type Invoice } from '../api/client'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { DataTable } from '../components/tables/DataTable'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/StatusBadge'

export function InvoicesListPage() {
  const nav = useNavigate()
  const { projectId } = useParams()
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    if (!projectId) return
    listInvoices(projectId).then(setInvoices).catch(() => setInvoices([]))
  }, [projectId])

  const cols = useMemo<ColumnDef<Invoice>[]>(
    () => [
      { header: 'Type', accessorKey: 'type' },
      { header: 'Estimate #', accessorKey: 'invoiceNo' },
      { header: 'Job', accessorKey: 'job' },
      { header: 'Salesperson', accessorKey: 'salesperson' },
      { header: 'Due Date', accessorKey: 'dueDate' },
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
        title="Invoices"
        subtitle="Project invoices/estimates "
        right={
          <Button
            type="button"
            variant="primary"
            onClick={async () => {
              const inv = await createEstimate(projectId)
              nav(`/projects/${projectId}/invoices/${inv.id}`)
            }}
          >
            New Estimate
          </Button>
        }
      />
      <CardBody>
        <DataTable
          data={invoices}
          columns={cols}
          onRowClick={(inv) => nav(`/projects/${projectId}/invoices/${inv.id}`)}
          emptyTitle="No invoices yet"
          emptyDescription="Create your first estimate to generate a printable preview."
        />
      </CardBody>
    </Card>
  )
}
