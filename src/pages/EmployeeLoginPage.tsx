import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { employeeLogin } from '../api/client'
import { Card, CardBody } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import brandLogo from '../assets/brand/brand-logo-primary.png'
import loginBg from '../assets/brand/login-bg.png'
import { useLanguage } from '../i18n/LanguageProvider'

const schema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

export function EmployeeLoginPage() {
  const nav = useNavigate()
  const [err, setErr] = useState<string | null>(null)
  const { lang, setLang } = useLanguage()

  const defaults = useMemo<FormValues>(() => ({ identifier: '', password: '1234' }), [])

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
                <h1 className="hTitle">Employee Portal</h1>
                <p className="hSub">
                  {lang === 'es'
                    ? 'Use usuario, telefono o email. Contrasena: 1234'
                    : 'Use username, phone, or email. Password: 1234'}
                </p>
              </div>
            </div>
          </div>
          <CardBody>
            <div className="field" style={{ marginBottom: 12 }}>
              <div className="label">{lang === 'es' ? 'Idioma' : 'Language'}</div>
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
                  await employeeLogin(v.identifier.trim(), v.password.trim())
                  nav('/employee/workorders')
                } catch (e) {
                  setErr(e instanceof Error ? e.message : 'Login failed')
                }
              })}
              style={{ display: 'grid', gap: 14 }}
            >
              <div className="field">
                <div className="label">{lang === 'es' ? 'Usuario / Telefono / Email' : 'Username / Phone / Email'}</div>
                <Input
                  placeholder={lang === 'es' ? 'Usuario, telefono o email' : 'Username, phone, or email'}
                  {...register('identifier')}
                  autoComplete="username"
                />
                {errors.identifier ? <div className="error">{errors.identifier.message}</div> : null}
              </div>

              <div className="field">
                <div className="label">{lang === 'es' ? 'Contrasena' : 'Password'}</div>
                <Input type="password" {...register('password')} autoComplete="current-password" />
                {errors.password ? <div className="error">{errors.password.message}</div> : null}
              </div>

              {err ? <div className="bannerDanger">{err}</div> : null}

              <div className="row loginActionsRow" style={{ justifyContent: 'space-between' }}>
                <Button type="button" onClick={() => nav('/login')}>
                  {lang === 'es' ? 'Acceso Admin' : 'Admin Login'}
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {lang === 'es' ? 'Iniciar sesion' : 'Sign in'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

