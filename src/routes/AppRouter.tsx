import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { isAuthed, isEmployeeAuthed } from '../api/client'
import { AppShell } from '../components/layout/AppShell'
import { LoginPage } from '../pages/LoginPage'
import { ProjectsListPage } from '../pages/ProjectsListPage'
import { ProjectDetailPage } from '../pages/ProjectDetailPage'
import { InvoicesListPage } from '../pages/InvoicesListPage'
import { InvoiceDetailPage } from '../pages/InvoiceDetailPage'
import { LedgerPage } from '../pages/LedgerPage'
import { WorkOrdersListPage } from '../pages/WorkOrdersListPage'
import { WorkOrderDetailPage } from '../pages/WorkOrderDetailPage'
import { PackagesPage } from '../pages/PackagesPage'
import { ActiveWorkOrdersPage } from '../pages/ActiveWorkOrdersPage'
import { EmployeeLoginPage } from '../pages/EmployeeLoginPage'
import { EmployeeWorkOrdersPage } from '../pages/EmployeeWorkOrdersPage'
import { EmployeeWorkOrderDetailPage } from '../pages/EmployeeWorkOrderDetailPage'

function PublicEntry() {
  if (isAuthed()) return <Navigate to="/projects" replace />
  if (isEmployeeAuthed()) return <Navigate to="/employee/workorders" replace />
  return <Navigate to="/login" replace />
}

function RequireAuth({ children }: { children: ReactElement }) {
  const loc = useLocation()
  if (!isAuthed()) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return children
}

function RequireEmployeeAuth({ children }: { children: ReactElement }) {
  const loc = useLocation()
  if (!isEmployeeAuthed()) return <Navigate to="/employee/login" replace state={{ from: loc.pathname }} />
  return children
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicEntry />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/employee/login" element={<EmployeeLoginPage />} />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/packages" element={<PackagesPage />} />
          <Route path="/workorders/active" element={<ActiveWorkOrdersPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/projects/:projectId/invoices" element={<InvoicesListPage />} />
          <Route path="/projects/:projectId/invoices/:invoiceId" element={<InvoiceDetailPage />} />
          <Route path="/projects/:projectId/ledger" element={<LedgerPage />} />
          <Route path="/projects/:projectId/workorders" element={<WorkOrdersListPage />} />
          <Route
            path="/projects/:projectId/workorders/:workOrderId"
            element={<WorkOrderDetailPage />}
          />
        </Route>

        <Route
          element={
            <RequireEmployeeAuth>
              <AppShell />
            </RequireEmployeeAuth>
          }
        >
          <Route path="/employee/workorders" element={<EmployeeWorkOrdersPage />} />
          <Route path="/employee/workorders/:workOrderId" element={<EmployeeWorkOrderDetailPage />} />
        </Route>

        <Route path="*" element={<PublicEntry />} />
      </Routes>
    </BrowserRouter>
  )
}
