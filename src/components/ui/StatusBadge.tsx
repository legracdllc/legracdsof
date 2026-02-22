import { Badge } from './Badge'
import type { InvoiceStatus, ProjectStatus, WorkOrderStatus } from '../../api/client'
import { useLanguage } from '../../i18n/LanguageProvider'

export function StatusBadge({
  status,
}: {
  status: ProjectStatus | InvoiceStatus | WorkOrderStatus
}) {
  const { tr } = useLanguage()
  const gold = status === 'Active' || status === 'Sent' || status === 'In Progress'
  return <Badge tone={gold ? 'gold' : 'navy'} className="statusBadge">{tr(status)}</Badge>
}
