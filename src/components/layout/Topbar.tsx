import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { employeeMe, listProjects, logout, type Project } from '../../api/client'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import brandLogo from '../../assets/brand/brand-logo-primary.png'
import { useLanguage } from '../../i18n/LanguageProvider'

export function Topbar({ onToggleMobileNav }: { onToggleMobileNav?: () => void } = {}) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const { lang, setLang, tr } = useLanguage()
  const isEmployeeArea = pathname.startsWith('/employee')
  const { projectId } = useParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [employeeName, setEmployeeName] = useState<string>('Employee')

  useEffect(() => {
    listProjects().then(setProjects).catch(() => setProjects([]))
  }, [])

  useEffect(() => {
    if (!isEmployeeArea) return
    employeeMe()
      .then((e) => setEmployeeName(e?.name ?? 'Employee'))
      .catch(() => setEmployeeName('Employee'))
  }, [isEmployeeArea])

  const current = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  )

  const visibleProjects = useMemo(() => projects.filter((p) => !p.archivedAt), [projects])

  const showProjectPicker = !pathname.startsWith('/login') && !isEmployeeArea
  const showDirectLogout = !pathname.startsWith('/login')

  function handleLogout() {
    setMenuOpen(false)
    logout()
    nav(isEmployeeArea ? '/employee/login' : '/login')
  }

  function MobileMenuButton({ onClick }: { onClick?: () => void }) {
    return (
      <button type="button" className="mobileMenuBtn" onClick={onClick} aria-label={tr('Open menu')}>
        <span />
        <span />
        <span />
      </button>
    )
  }

  return (
    <>
      <div className="row topbarLeft">
        <MobileMenuButton onClick={onToggleMobileNav} />
        {showProjectPicker ? (
          <div className="row topbarProjectWrap" style={{ gap: 12 }}>
            <img
              src={brandLogo}
              alt="Legra's"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: '1px solid var(--c-border)',
                objectFit: 'cover',
                background: 'rgba(255,255,255,0.85)',
              }}
            />
            <div className="topbarProjectSelect">
              <div className="label">Project</div>
              <Select
                value={projectId ?? ''}
                onChange={(e) => {
                  const id = e.target.value
                  if (!id) return
                  nav(`/projects/${id}`)
                }}
              >
                <option value="" disabled>
                  {current ? current.name : tr('Select a project')}
                </option>
                {visibleProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            {current ? <span className="badge badgeGold">{current.status}</span> : null}
          </div>
        ) : null}
      </div>

      <div className="row">
        {showDirectLogout ? (
          <Button type="button" variant="default" onClick={handleLogout}>
            {tr('Sign out')}
          </Button>
        ) : null}
        <details
          open={menuOpen}
          onToggle={(e) => setMenuOpen((e.target as HTMLDetailsElement).open)}
          style={{ position: 'relative' }}
        >
          <summary className="userMenuSummary">
            <span className="badge badgeNavy">{isEmployeeArea ? `${employeeName} (employee)` : 'Admin'}</span>
          </summary>
          <div className="userMenuPanel">
            <div className="help" style={{ marginBottom: 10 }}>
              {isEmployeeArea ? tr('Signed in to employee portal.') : tr('Signed in with auth.')}
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <div className="label">{tr('Language')}</div>
              <Select value={lang} onChange={(e) => setLang(e.target.value as 'en' | 'es')}>
                <option value="en">English</option>
                <option value="es">Español</option>
              </Select>
            </div>
            <Button type="button" onClick={handleLogout}>
              {tr('Sign out')}
            </Button>
          </div>
        </details>
      </div>
    </>
  )
}
