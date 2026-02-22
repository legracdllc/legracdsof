import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type AppLang = 'en' | 'es'

type Ctx = {
  lang: AppLang
  setLang: (next: AppLang) => void
  tr: (text: string) => string
}

const LANG_KEY = 'legra:lang'

const esMap: Record<string, string> = {
  Language: 'Idioma',
  'Sign out': 'Cerrar sesion',
  Project: 'Proyecto',
  Projects: 'Proyectos',
  Customers: 'Clientes',
  Inventory: 'Inventario',
  Employees: 'Empleados',
  Packages: 'Paquetes',
  'Active Work Orders': 'Ordenes Activas',
  'My Work Orders': 'Mis Ordenes',
  'Employee Portal': 'Portal Empleados',
  'Work Orders Portal': 'Portal de Ordenes',
  'Day 1 MVP': 'MVP Dia 1',
  'Signed in with auth.': 'Sesion iniciada.',
  'Signed in to employee portal.': 'Sesion iniciada en portal de empleados.',
  'Select a project': 'Seleccione un proyecto',
  'No results': 'Sin resultados',
  Active: 'Activo',
  Planning: 'Planificacion',
  Completed: 'Completado',
  'On Hold': 'En espera',
  Draft: 'Borrador',
  Sent: 'Enviado',
  Paid: 'Pagado',
  Voided: 'Anulado',
  'Not Started': 'No iniciado',
  'In Progress': 'En progreso',
  Blocked: 'Bloqueado',
  Done: 'Completado',
  Low: 'Baja',
  Medium: 'Media',
  High: 'Alta',
  Open: 'Abrir',
  Status: 'Estado',
  Assigned: 'Asignado',
  Priority: 'Prioridad',
  Start: 'Inicio',
  End: 'Fin',
  Actions: 'Acciones',
  'Close WO': 'Cerrar OT',
  Back: 'Volver',
  Save: 'Guardar',
  'Generate PDF': 'Generar PDF',
  'WhatsApp Test': 'Prueba WhatsApp',
  Title: 'Titulo',
  'All non-completed work orders and current status': 'Todas las ordenes no completadas y su estado actual',
  'No active work orders': 'No hay ordenes activas',
  'When work orders exist and are not Done, they will appear here.':
    'Cuando existan ordenes y no esten completadas, apareceran aqui.',
  Customer: 'Cliente',
  'Job address': 'Direccion de obra',
  Budget: 'Presupuesto',
  Revenue: 'Ingresos',
  Archived: 'Archivado',
  'Archive project': 'Archivar proyecto',
  Archive: 'Archivar',
  Address: 'Direccion',
  Email: 'Correo',
  Phone: 'Telefono',
  Name: 'Nombre',
  Role: 'Rol',
  Username: 'Usuario',
  Password: 'Contrasena',
  Inactive: 'Inactivo',
  'Reset Credentials': 'Restablecer credenciales',
  'Archive employee': 'Archivar empleado',
  'Customer list': 'Lista de clientes',
  'No customers': 'No hay clientes',
  'Customer list comes from clients.json + created projects.':
    'La lista proviene de clients.json y proyectos creados.',
  'Tip: click a customer to open their file.': 'Tip: haga clic en un cliente para abrir su expediente.',
  'Customer File': 'Expediente del cliente',
  'Personal info + linked projects': 'Informacion personal + proyectos vinculados',
  'New Project': 'Nuevo proyecto',
  'Select a customer from the table to see details here.':
    'Seleccione un cliente en la tabla para ver detalles aqui.',
  'No projects for this customer': 'No hay proyectos para este cliente',
  'Create a project to link it to this customer.':
    'Cree un proyecto para vincularlo con este cliente.',
  'Contractors / employees': 'Contratistas / empleados',
  'Add Employee': 'Agregar empleado',
  'Hide Archived': 'Ocultar archivados',
  'Show Archived': 'Mostrar archivados',
  'No employees': 'No hay empleados',
  'Add employees/contractors to assign work orders.':
    'Agregue empleados/contratistas para asignar ordenes de trabajo.',
  'This phone number is used as username.': 'Este telefono se usa como usuario.',
  'Password is fixed to 1234.': 'La contrasena esta fija en 1234.',
  Cancel: 'Cancelar',
  Dashboard: 'Panel',
  'Projects. Create a project to get started.':
    'Proyectos. Cree un proyecto para comenzar.',
  'Create Project': 'Crear proyecto',
  'No projects': 'No hay proyectos',
  'Create your first project to start invoices, project financials, and work orders.':
    'Cree su primer proyecto para iniciar facturas, finanzas y ordenes de trabajo.',
  Close: 'Cerrar',
  'Project name': 'Nombre del proyecto',
  'e.g. Garage to APT': 'ej. Garaje a apartamento',
  'New customer': 'Cliente nuevo',
  'Existing customer': 'Cliente existente',
  'Pick an existing customer or enter a new one.':
    'Elija un cliente existente o ingrese uno nuevo.',
  'Select customer': 'Seleccionar cliente',
  'Select...': 'Seleccione...',
  'Customer name': 'Nombre del cliente',
  'Customer address': 'Direccion del cliente',
  'Customer phone': 'Telefono del cliente',
  'Customer email': 'Correo del cliente',
  'Job location address': 'Direccion de la obra',
  Measurements: 'Medidas',
  'Enter measurements (e.g. Room A: 12ft x 10ft, Ceiling 8ft...)':
    'Ingrese medidas (ej. Habitacion A: 12ft x 10ft, Techo 8ft...)',
  'Stored as text for now. TODO: structured measurements.':
    'Guardado como texto por ahora. TODO: medidas estructuradas.',
  'Project media': 'Media del proyecto',
  'No media added.': 'No se agrego media.',
  Notes: 'Notas',
  'Project notes...': 'Notas del proyecto...',
  Create: 'Crear',
}

const LanguageContext = createContext<Ctx | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLang>(() => {
    const raw = (localStorage.getItem(LANG_KEY) ?? 'en').toLowerCase()
    return raw === 'es' ? 'es' : 'en'
  })

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: (next) => setLangState(next),
      tr: (text) => (lang === 'es' ? esMap[text] ?? text : text),
    }),
    [lang],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
