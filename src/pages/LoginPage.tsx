import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { employeeLogin, login } from '../api/client'
import { Card, CardBody } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import brandLogo from '../assets/brand/brand-logo-primary.png'
import loginBg from '../assets/brand/login-bg.png'
import { useLanguage } from '../i18n/LanguageProvider'

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const nav = useNavigate()
  const [err, setErr] = useState<string | null>(null)
  const { lang, setLang } = useLanguage()

  const defaults = useMemo<FormValues>(
    () => ({ username: 'admin', password: 'admin' }),
    [],
  )

  const t = useMemo(() => {
    if (lang === 'es') {
      return {
        title: "Legra's Admin",
        sub: 'Acceso (Dia 1). Usuario: admin / Contrasena: admin',
        user: 'Usuario',
        pass: 'Contrasena',
        signIn: 'Iniciar sesion',
        employeePortal: 'Portal Empleados',
        language: 'Idioma',
      }
    }
    return {
      title: "Legra's Admin",
      sub: 'Login (Day 1). Username: admin / Password: admin',
      user: 'Username',
      pass: 'Password',
      signIn: 'Sign in',
      employeePortal: 'Employee Portal',
      language: 'Language',
    }
  }, [lang])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults })

  return (
    <div
      className="loginPage"
      style={{
        backgroundImage: `linear-gradient(rgba(14, 28, 40, 0.92), rgba(14, 28, 40, 0.92)), url(${loginBg})`,
      }}
    >
      <div className="loginCardWrap">
        <Card>
          <div className="cardHeader">
            <div className="row loginHeaderRow">
              <img
                src={brandLogo}
                alt="Legra's"
                className="loginBrandLogo"
              />
              <div className="loginHeaderText">
                <h1 className="hTitle">{t.title}</h1>
                <p className="hSub">{t.sub}</p>
              </div>
            </div>
          </div>
          <CardBody>
            <div className="field" style={{ marginBottom: 12 }}>
              <div className="label">{t.language}</div>
              <select
                className="select"
                value={lang}
                onChange={(e) => setLang(e.target.value as 'en' | 'es')}
                style={{ maxWidth: '100%' }}
              >
                <option value="en">English</option>
                <option value="es">Espanol</option>
              </select>
            </div>
            <form
              onSubmit={handleSubmit(async (v) => {
                setErr(null)
                try {
                  const username = v.username.trim()
                  const password = v.password.trim()
                  try {
                    await login(username, password)
                    nav('/projects')
                    return
                  } catch {
                    // Fallback: allow employee credentials from the same login screen.
                    await employeeLogin(username, password)
                    nav('/employee/workorders')
                    return
                  }
                } catch (e) {
                  setErr(e instanceof Error ? e.message : 'Login failed')
                }
              })}
              style={{ display: 'grid', gap: 14 }}
            >
              <div className="field">
                <div className="label">{t.user}</div>
                <Input placeholder="admin" {...register('username')} autoComplete="username" />
                {errors.username ? <div className="error">{errors.username.message}</div> : null}
              </div>

              <div className="field">
                <div className="label">{t.pass}</div>
                <Input type="password" {...register('password')} autoComplete="current-password" />
                {errors.password ? <div className="error">{errors.password.message}</div> : null}
              </div>

              {err ? <div className="bannerDanger">{err}</div> : null}

              <div className="row loginActionsRow" style={{ justifyContent: 'flex-end' }}>
                <Button type="button" onClick={() => nav('/employee/login')}>
                  {t.employeePortal}
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {t.signIn}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}


