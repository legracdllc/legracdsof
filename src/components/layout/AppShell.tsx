import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="appShell">
      <aside className="sidebar">
        <Sidebar />
      </aside>
      {mobileNavOpen ? (
        <div className="mobileNavOverlay" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
      ) : null}
      <aside className={`mobileSidebar ${mobileNavOpen ? 'mobileSidebarOpen' : ''}`}>
        <Sidebar />
      </aside>
      <section className="main">
        <header className="topbar">
          <Topbar onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)} />
        </header>
        <div className="page">
          <Outlet />
        </div>
      </section>
    </div>
  )
}
