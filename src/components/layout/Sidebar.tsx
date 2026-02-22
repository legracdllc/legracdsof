import { Link, useLocation } from 'react-router-dom'
import brandLogo from '../../assets/brand/brand-logo-primary.png'
import { useLanguage } from '../../i18n/LanguageProvider'

export function Sidebar() {
  const { pathname, search } = useLocation()
  const { tr } = useLanguage()
  const isEmployeeArea = pathname.startsWith('/employee')
  const tab = new URLSearchParams(search).get('tab') ?? 'projects'

  const isProjectsActive = (() => {
    if (!pathname.startsWith('/projects')) return false
    if (pathname !== '/projects') return true
    return tab === 'projects'
  })()

  const isCustomersActive = pathname === '/projects' && tab === 'customers'
  const isInventoryActive = pathname === '/projects' && tab === 'inventory'
  const isEmployeesActive = pathname === '/projects' && tab === 'employees'
  const isPackagesActive = pathname.startsWith('/packages')
  const isActiveWorkOrdersActive = pathname.startsWith('/workorders/active')

  const itemClass = (active: boolean) => `navItem ${active ? 'navItemActive' : ''}`.trim()

  if (isEmployeeArea) {
    return (
      <div style={{ display: 'grid', gap: '18px' }}>
        <div>
          <div className="row" style={{ gap: 12 }}>
            <img
              src={brandLogo}
              alt="Legra's"
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                border: '1px solid var(--c-border)',
                background: 'rgba(255,255,255,0.8)',
                objectFit: 'cover',
              }}
            />
            <div>
              <div style={{ fontWeight: 900, letterSpacing: '0.06em', color: 'var(--c-navy)' }}>
                LEGRA&apos;S
                <span style={{ color: 'var(--c-gold)', marginLeft: 8 }}>EMPLOYEE</span>
              </div>
              <div className="help">{tr('Work Orders Portal')}</div>
            </div>
          </div>
        </div>

        <nav>
          <Link to="/employee/workorders" className={itemClass(pathname.startsWith('/employee/workorders'))}>
            {tr('My Work Orders')}
          </Link>
        </nav>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <div>
        <div className="row" style={{ gap: 12 }}>
          <img
            src={brandLogo}
            alt="Legra's"
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              border: '1px solid var(--c-border)',
              background: 'rgba(255,255,255,0.8)',
              objectFit: 'cover',
            }}
          />
          <div>
            <div style={{ fontWeight: 900, letterSpacing: '0.06em', color: 'var(--c-navy)' }}>
              LEGRA&apos;S
              <span style={{ color: 'var(--c-gold)', marginLeft: 8 }}>ADMIN</span>
            </div>
            <div className="help">{tr('Day 1 MVP')}</div>
          </div>
        </div>
        <div className="help">{tr('Day 1 MVP')}</div>
      </div>

      <nav>
        <Link to="/projects" className={itemClass(isProjectsActive)}>
          {tr('Projects')}
        </Link>
        <Link to="/projects?tab=customers" className={itemClass(isCustomersActive)}>
          {tr('Customers')}
        </Link>
        <Link to="/projects?tab=inventory" className={itemClass(isInventoryActive)}>
          {tr('Inventory')}
        </Link>
        <Link to="/projects?tab=employees" className={itemClass(isEmployeesActive)}>
          {tr('Employees')}
        </Link>
        <Link to="/packages" className={itemClass(isPackagesActive)}>
          {tr('Packages')}
        </Link>
        <Link to="/workorders/active" className={itemClass(isActiveWorkOrdersActive)}>
          {tr('Active Work Orders')}
        </Link>
      </nav>

      <div className="card" style={{ padding: '14px' }}>
        <div className="label">Brand assets</div>
        <div className="help">
          Primary logo wired from <code>src/assets/brand/brand-logo-primary.png</code>. Add the rest
          from the spec as needed.
        </div>
      </div>
    </div>
  )
}
