# Delivery Files

All key files requested in the spec are included below as exact snapshots from disk.

## package.json

`$lang
{
  "name": "web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "node ./node_modules/vite/bin/vite.js",
    "build": "node ./node_modules/typescript/bin/tsc -b && node ./node_modules/vite/bin/vite.js build",
    "lint": "eslint .",
    "preview": "node ./node_modules/vite/bin/vite.js preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@tanstack/react-table": "^8.21.3",
    "dayjs": "^1.11.19",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-hook-form": "^7.71.1",
    "react-router-dom": "^7.13.0",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/node": "^24.10.1",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.48.0",
    "vite": "^7.3.1"
  }
}

```

## vite.config.ts

`$lang
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})

```

## index.html

`$lang
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Legra&apos;s Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

```

## tsconfig.app.json

`$lang
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "resolveJsonModule": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}

```

## README.md

`$lang
# Legra's Admin (Web)

Web Admin UI (React + Vite) for Legra's Construction & Development LLC. Backend is not required for Day 1: the app runs fully on local mock JSON with a mock API client.

## Stack

- React + Vite + TypeScript
- React Router
- TanStack Table
- React Hook Form + Zod
- dayjs

## Routes (Exact)

- `/login`
- `/projects`
- `/projects/:projectId`
- `/projects/:projectId/invoices`
- `/projects/:projectId/invoices/:invoiceId`
- `/projects/:projectId/ledger`
- `/projects/:projectId/workorders`
- `/projects/:projectId/workorders/:workOrderId`

## Getting Started

```bash
npm install
npm run dev
```

If PowerShell blocks `npm` scripts, use:

```bash
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:5173`.

## Mock Mode

Mock mode is enabled by default:

- `VITE_USE_MOCK=true` (default)

Mock data lives in `src/mock/*.json`. The mock API client is `src/api/client.ts` and uses `localStorage` to persist edits (Save buttons).

## Login

The login is mock:

- Username: `admin`
- Password: `admin`

On success it redirects to `/projects`.

## Printing Invoices

Invoice preview is designed for Letter printing. Print styles hide the app chrome (sidebar/topbar) and only print the invoice preview.

## Brand Assets

Brand assets live in `src/assets/brand/`.

- `brand-logo-primary.png` is used in Sidebar + Login.
- The spec-required filenames also exist as placeholders (see `src/assets/brand/ASSETS_TODO.md`). Replace them with originals when available.

## Delivery Snapshot

`DELIVERY.md` contains a complete snapshot of the key source files requested by the spec, including full imports.

```

## src/App.tsx

`$lang
import { ThemeProvider } from './theme/ThemeProvider'
import { AppRouter } from './routes/AppRouter'

export default function App() {
  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  )
}

```

## src/main.tsx

`$lang
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

```

## src/index.css

`$lang
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  /* Brand palette (do not add new colors) */
  --c-navy: #0e1c28;
  --c-gold: #9e6b0f;
  --c-gold-accent: #dcaf36;
  --c-bg: #ffffff;
  --c-text: #111827;
  --c-border: #e5e7eb;
  --c-muted: #6b7280;

  /* Theme tokens */
  --r-sm: 10px;
  --r-md: 14px;
  --r-lg: 18px;

  --s-1: 6px;
  --s-2: 10px;
  --s-3: 14px;
  --s-4: 18px;
  --s-5: 24px;
  --s-6: 32px;

  --shadow-1: 0 1px 0 rgba(17, 24, 39, 0.06), 0 12px 24px rgba(17, 24, 39, 0.06);
  --shadow-2: 0 1px 0 rgba(17, 24, 39, 0.06), 0 18px 40px rgba(17, 24, 39, 0.1);

  --t-fast: 140ms;
  --t-med: 220ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);

  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  line-height: 1.45;
  font-weight: 400;

  color: var(--c-text);
  background: var(--c-bg);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

html,
body {
  height: 100%;
}

body {
  margin: 0;
  background:
    radial-gradient(1200px 700px at 80% -10%, rgba(220, 175, 54, 0.14), transparent 55%),
    radial-gradient(900px 600px at -10% 20%, rgba(14, 28, 40, 0.06), transparent 55%),
    var(--c-bg);
}

a {
  color: inherit;
  text-decoration: none;
}

::selection {
  background: rgba(220, 175, 54, 0.25);
}

code,
pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
}

/* Layout */
.appShell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px 1fr;
}

.sidebar {
  border-right: 1px solid var(--c-border);
  background:
    var(--sidebar-bg-img, none) 50% 30% / cover no-repeat,
    radial-gradient(900px 420px at 30% -10%, rgba(220, 175, 54, 0.14), transparent 50%),
    linear-gradient(180deg, rgba(14, 28, 40, 0.05), rgba(14, 28, 40, 0.02));
  padding: var(--s-5) var(--s-4);
  background-blend-mode: overlay, normal, normal;
}

.topbar {
  height: 64px;
  border-bottom: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--s-5);
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 0 rgba(17, 24, 39, 0.03);
}

.main {
  display: grid;
  grid-template-rows: 64px 1fr;
}

.page {
  padding: var(--s-6);
  max-width: 1200px;
  width: 100%;
  animation: pageIn var(--t-med) var(--ease-out) both;
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-5);
}

@media (max-width: 980px) {
  .appShell {
    grid-template-columns: 1fr;
  }
  .sidebar {
    display: none;
  }
  .page {
    padding: var(--s-5);
  }
  .grid2 {
    grid-template-columns: 1fr;
  }
}

/* UI primitives */
.card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-1);
  transition:
    transform var(--t-med) var(--ease-out),
    box-shadow var(--t-med) var(--ease-out),
    border-color var(--t-med) var(--ease-out);
}
.card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-2);
  border-color: rgba(220, 175, 54, 0.35);
}
.cardHeader {
  padding: var(--s-5);
  border-bottom: 1px solid var(--c-border);
}
.cardBody {
  padding: var(--s-5);
}

.hTitle {
  font-size: 22px;
  letter-spacing: -0.02em;
  margin: 0;
}
.hSub {
  margin: 6px 0 0 0;
  color: var(--c-muted);
  font-size: 13px;
}

.btn {
  height: 40px;
  padding: 0 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--c-border);
  background: #fff;
  color: var(--c-text);
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition:
    border-color var(--t-fast) var(--ease-out),
    transform var(--t-fast) var(--ease-out),
    filter var(--t-fast) var(--ease-out);
}
.btn:hover {
  border-color: rgba(158, 107, 15, 0.55);
  transform: translateY(-1px);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.btnPrimary {
  background: linear-gradient(180deg, rgba(158, 107, 15, 1), rgba(120, 80, 8, 1));
  border-color: rgba(120, 80, 8, 1);
  color: #fff;
}
.btnPrimary:hover {
  filter: brightness(1.03);
}
.btnDanger {
  border-color: rgba(17, 24, 39, 0.35);
  background: rgba(14, 28, 40, 0.06);
}

.input,
.select,
.textarea {
  width: 100%;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.96);
  color: var(--c-text);
  outline: none;
}
.input:focus,
.select:focus,
.textarea:focus {
  border-color: rgba(158, 107, 15, 0.65);
  box-shadow: 0 0 0 4px rgba(220, 175, 54, 0.18);
}
.field {
  display: grid;
  gap: 6px;
}
.label {
  font-size: 12px;
  color: var(--c-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.help {
  color: var(--c-muted);
  font-size: 12px;
}
.error {
  color: var(--c-navy);
  font-size: 12px;
}

.badge {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--c-border);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: rgba(255, 255, 255, 0.8);
}
.badgeGold {
  border-color: rgba(220, 175, 54, 0.55);
  background: rgba(220, 175, 54, 0.16);
}
.badgeNavy {
  border-color: rgba(14, 28, 40, 0.35);
  background: rgba(14, 28, 40, 0.08);
}

.row {
  display: flex;
  gap: var(--s-3);
  align-items: center;
  flex-wrap: wrap;
}
.spacer {
  flex: 1;
}
.muted {
  color: var(--c-muted);
}

/* Tables */
.tableWrap {
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
}
.tableWrap table {
  background: transparent;
}
table {
  border-collapse: collapse;
  width: 100%;
}
th,
td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--c-border);
  text-align: left;
  font-size: 14px;
}
th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--c-muted);
  font-weight: 700;
  background: rgba(14, 28, 40, 0.03);
}
tr:hover td {
  background: rgba(220, 175, 54, 0.06);
}
tbody tr:nth-child(even) td {
  background: rgba(14, 28, 40, 0.015);
}
tbody tr:nth-child(even):hover td {
  background: rgba(220, 175, 54, 0.07);
}
tbody tr:last-child td {
  border-bottom: none;
}

/* Sidebar nav */
.navItem {
  font-weight: 800;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid transparent;
  display: block;
  margin-bottom: 8px;
  transition:
    background var(--t-fast) var(--ease-out),
    border-color var(--t-fast) var(--ease-out),
    transform var(--t-fast) var(--ease-out);
}
.navItem:hover {
  background: rgba(220, 175, 54, 0.1);
  transform: translateX(1px);
}
.navItemActive {
  border-color: rgba(220, 175, 54, 0.55);
  background: rgba(220, 175, 54, 0.16);
}
.navItemDisabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Invoice */
.invoiceTwoCol {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: var(--s-5);
}
@media (max-width: 1100px) {
  .invoiceTwoCol {
    grid-template-columns: 1fr;
  }
}
.docWrap {
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--shadow-1);
  padding: var(--s-4);
}
.docPage {
  width: 816px; /* Letter at 96dpi */
  max-width: 100%;
  margin: 0 auto;
  background: #fff;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  padding: 28px;
  position: relative;
  overflow: hidden;
}
.docPage:before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(700px 220px at 90% 0%, rgba(220, 175, 54, 0.1), transparent 55%),
    radial-gradient(500px 200px at 0% 20%, rgba(14, 28, 40, 0.04), transparent 60%);
  opacity: 0.8;
}
.docPage > * {
  position: relative;
}
.docHeader {
  display: grid;
  gap: 6px;
  margin-bottom: 18px;
}
.docH1 {
  font-weight: 800;
  letter-spacing: 0.02em;
  font-size: 15px;
}
.docH2 {
  font-weight: 800;
  font-size: 14px;
}
.docMeta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin: 12px 0 18px 0;
}
.docBox {
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  padding: 12px;
}
.docMetaTable {
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  overflow: hidden;
}
.docTable {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.docTable th,
.docTable td {
  border-right: 1px solid var(--c-border);
  border-bottom: 1px solid var(--c-border);
  padding: 8px 8px;
  font-size: 11px;
  line-height: 1.25;
  vertical-align: top;
}
.docTable th {
  background: rgba(14, 28, 40, 0.03);
  color: var(--c-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 900;
  font-size: 10px;
}
.docTable tr:last-child td {
  border-bottom: none;
}
.docTable th:last-child,
.docTable td:last-child {
  border-right: none;
}
.docK {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--c-muted);
  font-weight: 800;
}
.docV {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 700;
}
.bannerDanger {
  border: 1px solid rgba(14, 28, 40, 0.35);
  background: rgba(14, 28, 40, 0.08);
  border-radius: var(--r-lg);
  padding: 12px 14px;
  font-weight: 700;
}

/* Ledger */
.sheetGrid {
  display: grid;
  gap: var(--s-4);
}
.sheetSection {
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  background: rgba(255, 255, 255, 0.9);
  overflow: hidden;
}
.sheetSectionHeader {
  padding: 12px 14px;
  border-bottom: 1px solid var(--c-border);
  background: rgba(220, 175, 54, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sheetSectionTitle {
  font-weight: 800;
  letter-spacing: 0.02em;
}
.sheetRow {
  display: grid;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--c-border);
}
.sheetRow2 {
  grid-template-columns: 1fr 180px;
}
.sheetRow4 {
  grid-template-columns: 1.4fr 160px 140px 1fr;
}
.thumbs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.thumb {
  width: 92px;
  height: 70px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  object-fit: cover;
}

/* User menu (mock) */
.userMenuSummary {
  list-style: none;
  cursor: pointer;
  user-select: none;
}
.userMenuSummary::-webkit-details-marker {
  display: none;
}
.userMenuPanel {
  position: absolute;
  right: 0;
  top: 44px;
  width: 220px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-2);
  padding: 12px;
}

/* Modal */
.modalBackdrop {
  position: fixed;
  inset: 0;
  background: rgba(14, 28, 40, 0.35);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 50;
}
.modalPanel {
  width: 720px;
  max-width: 100%;
  border-radius: var(--r-lg);
  border: 1px solid var(--c-border);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-2);
  overflow: hidden;
}
.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--c-border);
  background: rgba(14, 28, 40, 0.03);
}
.modalBody {
  padding: 14px;
}
.modalClose {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid var(--c-border);
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
}
.modalClose:hover {
  border-color: rgba(158, 107, 15, 0.55);
}

@media print {
  body {
    background: #fff;
  }
  .sidebar,
  .topbar {
    display: none !important;
  }
  .main {
    grid-template-rows: 1fr;
  }
  .page {
    padding: 0 !important;
    max-width: none !important;
  }
  .card {
    box-shadow: none !important;
    border: none !important;
  }
  .invoiceTwoCol {
    grid-template-columns: 1fr !important;
  }
  /* Hide editor card when printing invoice detail */
  .invoiceTwoCol > .card:first-child {
    display: none !important;
  }
  .docWrap {
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
  }
  .docPage {
    border: none !important;
    border-radius: 0 !important;
    width: auto !important;
    padding: 0.5in !important;
  }
  .docPage:before {
    display: none !important;
  }
}

@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

```

## src/theme/tokens.ts

`$lang
export const tokens = {
  colors: {
    navy: '#0E1C28',
    gold: '#9E6B0F',
    goldAccent: '#DCAF36',
    background: '#FFFFFF',
    text: '#111827',
    border: '#E5E7EB',
    muted: '#6B7280',
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
  },
  spacing: {
    1: 6,
    2: 10,
    3: 14,
    4: 18,
    5: 24,
    6: 32,
  },
} as const


```

## src/theme/ThemeProvider.tsx

`$lang
import { createContext, useContext, type ReactNode } from 'react'
import { tokens } from './tokens'

type Theme = {
  tokens: typeof tokens
}

const ThemeContext = createContext<Theme | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={{ tokens }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const v = useContext(ThemeContext)
  if (!v) throw new Error('useTheme must be used within ThemeProvider')
  return v
}


```

## src/api/client.ts

`$lang
import auth from '../mock/auth.json'
import projects from '../mock/projects.json'
import clients from '../mock/clients.json'
import invoices from '../mock/invoices.json'
import invoiceItems from '../mock/invoiceItems.json'
import payments from '../mock/payments.json'
import ledger from '../mock/ledger.json'
import workorders from '../mock/workorders.json'
import retailSnapshots from '../mock/retailSnapshots.json'

export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true'

export type User = {
  id: string
  name: string
  email: string
}

export type ProjectStatus = 'Active' | 'Planning' | 'Completed' | 'On Hold'
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Voided'
export type WorkOrderStatus = 'Not Started' | 'In Progress' | 'Blocked' | 'Done'
export type WorkOrderPriority = 'Low' | 'Medium' | 'High'

export type Client = {
  id: string
  name: string
  address: string
  phone?: string
}

export type Project = {
  id: string
  name: string
  clientId: string
  status: ProjectStatus
  jobAddress: string
  jobPhone: string
  apptDate: string
  budgetTotal: number
  revenue: number
  customerPaid: number
  reminder: string
}

export type Invoice = {
  id: string
  projectId: string
  invoiceNo: string
  type: 'Estimate' | 'Invoice'
  status: InvoiceStatus
  salesperson: string
  job: string
  shippingMethod: string
  shippingTerms: string
  deliveryDate: string
  paymentTerms: string
  dueDate: string
  discount: number
}

export type InvoiceItem = {
  id: string
  invoiceId: string
  qty: number
  itemNo: string
  description: string
  unitPrice: number
}

export type PaymentSchedule = {
  invoiceId: string
  downPayment: number
  secondPayment: number
  thirdPayment: number
  finalPayment: number
}

export type LedgerRow2 = { id: string; item: string; total: number }
export type LedgerRow4 = { id: string; job: string; cost: number; paid: number; reminder: string }
export type LedgerDoc = {
  projectId: string
  homeDepotLowes: LedgerRow2[]
  amazon: LedgerRow2[]
  subContractor: LedgerRow4[]
}

export type WorkOrderChecklistItem = { id: string; text: string; done: boolean }
export type WorkOrderNote = { id: string; at: string; author: string; text: string }
export type WorkOrderMedia = { id: string; name: string; previewUrl: string }
export type WorkOrder = {
  id: string
  projectId: string
  title: string
  status: WorkOrderStatus
  priority: WorkOrderPriority
  startDate: string
  endDate: string
  assignedTo: string[]
  checklist: WorkOrderChecklistItem[]
  notes: WorkOrderNote[]
  media: WorkOrderMedia[]
}

type RetailSnapshots = {
  purchaseOrders: Array<{
    id: string
    projectId: string
    vendor: string
    color: string
    items: string[]
  }>
}

const LS = {
  token: 'legra:token',
  projects: 'legra:mock:projects',
  clients: 'legra:mock:clients',
  invoices: 'legra:mock:invoices',
  invoiceItems: 'legra:mock:invoiceItems',
  payments: 'legra:mock:payments',
  ledger: 'legra:mock:ledger',
  workorders: 'legra:mock:workorders',
}

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

function ensureSeeded() {
  if (!localStorage.getItem(LS.projects)) writeJson(LS.projects, projects)
  if (!localStorage.getItem(LS.clients)) writeJson(LS.clients, clients)
  if (!localStorage.getItem(LS.invoices)) writeJson(LS.invoices, invoices)
  if (!localStorage.getItem(LS.invoiceItems)) writeJson(LS.invoiceItems, invoiceItems)
  if (!localStorage.getItem(LS.payments)) writeJson(LS.payments, payments)
  if (!localStorage.getItem(LS.ledger)) writeJson(LS.ledger, ledger)
  if (!localStorage.getItem(LS.workorders)) writeJson(LS.workorders, workorders)
}

export function isAuthed() {
  return Boolean(localStorage.getItem(LS.token))
}

export function logout() {
  localStorage.removeItem(LS.token)
}

export async function login(username: string, password: string): Promise<User> {
  if (!USE_MOCK) throw new Error('TODO: real backend login')
  if (username !== 'admin' || password !== 'admin') {
    throw new Error('Invalid credentials')
  }
  localStorage.setItem(LS.token, auth.token)
  return { ...auth.defaultUser, email: 'admin@legra.mock' }
}

export async function me(): Promise<User | null> {
  if (!USE_MOCK) throw new Error('TODO: real backend me()')
  if (!isAuthed()) return null
  return auth.defaultUser
}

export async function listProjects(): Promise<Project[]> {
  if (!USE_MOCK) throw new Error('TODO: real backend listProjects()')
  ensureSeeded()
  return readJson<Project[]>(LS.projects, projects as Project[])
}

export async function getProject(projectId: string): Promise<Project | null> {
  const all = (await listProjects()) as Project[]
  return all.find((p) => p.id === projectId) ?? null
}

export async function listClients(): Promise<Client[]> {
  if (!USE_MOCK) throw new Error('TODO: real backend listClients()')
  ensureSeeded()
  return readJson<Client[]>(LS.clients, clients as Client[])
}

export async function getClient(clientId: string): Promise<Client | null> {
  const all = await listClients()
  return all.find((c) => c.id === clientId) ?? null
}

export async function createProject(input: {
  projectName: string
  clientName: string
  clientAddress: string
  jobAddress: string
  status: ProjectStatus
  budgetTotal: number
  revenue: number
}): Promise<Project> {
  if (!USE_MOCK) throw new Error('TODO: real backend createProject()')
  ensureSeeded()

  const allClients = readJson<Client[]>(LS.clients, clients as Client[])
  const newClient: Client = {
    id: `cli_${crypto.randomUUID()}`,
    name: input.clientName,
    address: input.clientAddress,
    phone: '',
  }

  const allProjects = readJson<Project[]>(LS.projects, projects as Project[])
  const today = new Date().toISOString().slice(0, 10)
  const next: Project = {
    id: `proj_${crypto.randomUUID()}`,
    name: input.projectName,
    clientId: newClient.id,
    status: input.status,
    jobAddress: input.jobAddress,
    jobPhone: '',
    apptDate: today,
    budgetTotal: input.budgetTotal,
    revenue: input.revenue,
    customerPaid: 0,
    reminder: '',
  }

  writeJson(LS.clients, [newClient, ...allClients])
  writeJson(LS.projects, [next, ...allProjects])
  return next
}

export async function listInvoices(projectId: string): Promise<Invoice[]> {
  if (!USE_MOCK) throw new Error('TODO: real backend listInvoices()')
  ensureSeeded()
  const all = readJson<Invoice[]>(LS.invoices, invoices as Invoice[])
  return all.filter((i) => i.projectId === projectId)
}

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  if (!USE_MOCK) throw new Error('TODO: real backend getInvoice()')
  ensureSeeded()
  const all = readJson<Invoice[]>(LS.invoices, invoices as Invoice[])
  return all.find((i) => i.id === invoiceId) ?? null
}

export async function saveInvoice(updated: Invoice): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend saveInvoice()')
  ensureSeeded()
  const all = readJson<Invoice[]>(LS.invoices, invoices as Invoice[])
  const next = all.map((i) => (i.id === updated.id ? updated : i))
  writeJson(LS.invoices, next)
}

export async function createEstimate(projectId: string): Promise<Invoice> {
  if (!USE_MOCK) throw new Error('TODO: real backend createEstimate()')
  ensureSeeded()
  const all = readJson<Invoice[]>(LS.invoices, invoices as Invoice[])
  const next: Invoice = {
    id: `inv_${crypto.randomUUID()}`,
    projectId,
    invoiceNo: String(300 + all.length + 1),
    type: 'Estimate',
    status: 'Draft',
    salesperson: 'Celso Legra',
    job: 'New estimate',
    shippingMethod: 'N/A',
    shippingTerms: 'N/A',
    deliveryDate: new Date().toISOString().slice(0, 10),
    paymentTerms: 'Per schedule',
    dueDate: new Date().toISOString().slice(0, 10),
    discount: 0,
  }
  writeJson(LS.invoices, [next, ...all])
  writeJson(LS.invoiceItems, [
    { id: `item_${crypto.randomUUID()}`, invoiceId: next.id, qty: 1, itemNo: '001', description: 'New line item', unitPrice: 0 },
    ...readJson<InvoiceItem[]>(LS.invoiceItems, invoiceItems as InvoiceItem[]),
  ])
  writeJson(LS.payments, [
    { invoiceId: next.id, downPayment: 0, secondPayment: 0, thirdPayment: 0, finalPayment: 0 },
    ...readJson<PaymentSchedule[]>(LS.payments, payments as PaymentSchedule[]),
  ])
  return next
}

export async function listInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  if (!USE_MOCK) throw new Error('TODO: real backend listInvoiceItems()')
  ensureSeeded()
  const all = readJson<InvoiceItem[]>(LS.invoiceItems, invoiceItems as InvoiceItem[])
  return all.filter((it) => it.invoiceId === invoiceId)
}

export async function saveInvoiceItems(invoiceId: string, items: InvoiceItem[]): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend saveInvoiceItems()')
  ensureSeeded()
  const all = readJson<InvoiceItem[]>(LS.invoiceItems, invoiceItems as InvoiceItem[])
  const kept = all.filter((it) => it.invoiceId !== invoiceId)
  writeJson(LS.invoiceItems, [...kept, ...items])
}

export async function getPaymentSchedule(invoiceId: string): Promise<PaymentSchedule | null> {
  if (!USE_MOCK) throw new Error('TODO: real backend getPaymentSchedule()')
  ensureSeeded()
  const all = readJson<PaymentSchedule[]>(LS.payments, payments as PaymentSchedule[])
  return all.find((p) => p.invoiceId === invoiceId) ?? null
}

export async function savePaymentSchedule(schedule: PaymentSchedule): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend savePaymentSchedule()')
  ensureSeeded()
  const all = readJson<PaymentSchedule[]>(LS.payments, payments as PaymentSchedule[])
  const next = all.filter((p) => p.invoiceId !== schedule.invoiceId)
  writeJson(LS.payments, [...next, schedule])
}

export async function getLedger(projectId: string): Promise<LedgerDoc | null> {
  if (!USE_MOCK) throw new Error('TODO: real backend getLedger()')
  ensureSeeded()
  const all = readJson<LedgerDoc[]>(LS.ledger, ledger as LedgerDoc[])
  return all.find((l) => l.projectId === projectId) ?? null
}

export async function saveLedger(doc: LedgerDoc): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend saveLedger()')
  ensureSeeded()
  const all = readJson<LedgerDoc[]>(LS.ledger, ledger as LedgerDoc[])
  const next = all.filter((l) => l.projectId !== doc.projectId)
  writeJson(LS.ledger, [...next, doc])
}

export async function listWorkOrders(projectId: string): Promise<WorkOrder[]> {
  if (!USE_MOCK) throw new Error('TODO: real backend listWorkOrders()')
  ensureSeeded()
  const all = readJson<WorkOrder[]>(LS.workorders, workorders as WorkOrder[])
  return all.filter((w) => w.projectId === projectId)
}

export async function getWorkOrder(workOrderId: string): Promise<WorkOrder | null> {
  if (!USE_MOCK) throw new Error('TODO: real backend getWorkOrder()')
  ensureSeeded()
  const all = readJson<WorkOrder[]>(LS.workorders, workorders as WorkOrder[])
  return all.find((w) => w.id === workOrderId) ?? null
}

export async function saveWorkOrder(order: WorkOrder): Promise<void> {
  if (!USE_MOCK) throw new Error('TODO: real backend saveWorkOrder()')
  ensureSeeded()
  const all = readJson<WorkOrder[]>(LS.workorders, workorders as WorkOrder[])
  const next = all.map((w) => (w.id === order.id ? order : w))
  writeJson(LS.workorders, next)
}

export async function createWorkOrder(projectId: string): Promise<WorkOrder> {
  if (!USE_MOCK) throw new Error('TODO: real backend createWorkOrder()')
  ensureSeeded()
  const all = readJson<WorkOrder[]>(LS.workorders, workorders as WorkOrder[])
  const now = new Date()
  const start = now.toISOString().slice(0, 10)
  const end = new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10)
  const next: WorkOrder = {
    id: `wo_${crypto.randomUUID()}`,
    projectId,
    title: 'New Work Order',
    status: 'Not Started',
    priority: 'Medium',
    startDate: start,
    endDate: end,
    assignedTo: [],
    checklist: [{ id: `c_${crypto.randomUUID()}`, text: 'First task', done: false }],
    notes: [],
    media: [],
  }
  writeJson(LS.workorders, [next, ...all])
  return next
}

export async function getRetailSnapshots(): Promise<RetailSnapshots> {
  if (!USE_MOCK) throw new Error('TODO: real backend getRetailSnapshots()')
  return retailSnapshots as RetailSnapshots
}

```

## src/routes/AppRouter.tsx

`$lang
import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { isAuthed } from '../api/client'
import { AppShell } from '../components/layout/AppShell'
import { LoginPage } from '../pages/LoginPage'
import { ProjectsListPage } from '../pages/ProjectsListPage'
import { ProjectDetailPage } from '../pages/ProjectDetailPage'
import { InvoicesListPage } from '../pages/InvoicesListPage'
import { InvoiceDetailPage } from '../pages/InvoiceDetailPage'
import { LedgerPage } from '../pages/LedgerPage'
import { WorkOrdersListPage } from '../pages/WorkOrdersListPage'
import { WorkOrderDetailPage } from '../pages/WorkOrderDetailPage'

function RequireAuth({ children }: { children: ReactElement }) {
  const loc = useLocation()
  if (!isAuthed()) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return children
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsListPage />} />
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

        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

```

## src/components/ui/Button.tsx

`$lang
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'default' | 'primary' | 'danger'

export function Button({
  variant = 'default',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const v =
    variant === 'primary' ? 'btnPrimary' : variant === 'danger' ? 'btnDanger' : ''
  return <button className={`btn ${v} ${className}`.trim()} {...props} />
}


```

## src/components/ui/Input.tsx

`$lang
import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input ${className}`.trim()} {...props} />
}


```

## src/components/ui/Select.tsx

`$lang
import type { SelectHTMLAttributes } from 'react'

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`select ${className}`.trim()} {...props} />
}


```

## src/components/ui/Card.tsx

`$lang
import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`.trim()}>{children}</div>
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="cardHeader">
      <div className="row">
        <div>
          <h1 className="hTitle">{title}</h1>
          {subtitle ? <p className="hSub">{subtitle}</p> : null}
        </div>
        <div className="spacer" />
        {right ?? null}
      </div>
    </div>
  )
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="cardBody">{children}</div>
}


```

## src/components/ui/Badge.tsx

`$lang
import type { ReactNode } from 'react'

export function Badge({
  tone = 'navy',
  children,
}: {
  tone?: 'navy' | 'gold'
  children: ReactNode
}) {
  const cls = tone === 'gold' ? 'badgeGold' : 'badgeNavy'
  return <span className={`badge ${cls}`.trim()}>{children}</span>
}


```

## src/components/ui/StatusBadge.tsx

`$lang
import { Badge } from './Badge'
import type { InvoiceStatus, ProjectStatus, WorkOrderStatus } from '../../api/client'

export function StatusBadge({
  status,
}: {
  status: ProjectStatus | InvoiceStatus | WorkOrderStatus
}) {
  const gold = status === 'Active' || status === 'Sent' || status === 'In Progress'
  return <Badge tone={gold ? 'gold' : 'navy'}>{status}</Badge>
}


```

## src/components/ui/MoneyInput.tsx

`$lang
import { useMemo } from 'react'
import { Input } from './Input'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function parseMoney(s: string): number {
  const cleaned = s.replace(/[^0-9.]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

export function MoneyInput({
  value,
  onChange,
  placeholder = '$0.00',
}: {
  value: number
  onChange: (next: number) => void
  placeholder?: string
}) {
  const display = useMemo(() => (Number.isFinite(value) ? fmt.format(value) : ''), [value])
  return (
    <Input
      value={display}
      placeholder={placeholder}
      inputMode="decimal"
      onChange={(e) => onChange(parseMoney(e.target.value))}
    />
  )
}

export const money = {
  fmt: (n: number) => fmt.format(n),
}


```

## src/components/ui/FileUploadMock.tsx

`$lang
import { useRef } from 'react'
import { Button } from './Button'

export type UploadMockFile = { id: string; name: string; previewUrl: string }

export function FileUploadMock({
  onAdd,
}: {
  onAdd: (files: UploadMockFile[]) => void
}) {
  const ref = useRef<HTMLInputElement | null>(null)

  return (
    <div className="row">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const list = Array.from(e.target.files ?? [])
          const mapped = list.map((f) => ({
            id: crypto.randomUUID(),
            name: f.name,
            previewUrl: URL.createObjectURL(f),
          }))
          onAdd(mapped)
          if (ref.current) ref.current.value = ''
        }}
      />
      <Button type="button" onClick={() => ref.current?.click()}>
        Upload media (mock)
      </Button>
      <span className="help">Adds local thumbnails only. TODO: real upload.</span>
    </div>
  )
}


```

## src/components/ui/EmptyState.tsx

`$lang
import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div
      className="card"
      style={{
        padding: 18,
        borderStyle: 'dashed',
        background: 'rgba(255,255,255,0.75)',
      }}
    >
      <div style={{ fontWeight: 900, letterSpacing: '-0.01em' }}>{title}</div>
      {description ? <div className="help" style={{ marginTop: 6 }}>{description}</div> : null}
      {action ? <div className="row" style={{ marginTop: 12 }}>{action}</div> : null}
    </div>
  )
}


```

## src/components/ui/Modal.tsx

`$lang
import type { ReactNode } from 'react'

export function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null

  return (
    <div className="modalBackdrop" onMouseDown={onClose} role="presentation">
      <div
        className="modalPanel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <div style={{ fontWeight: 900 }}>{title}</div>
          <button className="modalClose" type="button" onClick={onClose} aria-label="Close">
            Ã—
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  )
}


```

## src/components/tables/DataTable.tsx

`$lang
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { EmptyState } from '../ui/EmptyState'

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  emptyTitle = 'No results',
  emptyDescription,
}: {
  data: T[]
  columns: ColumnDef<T, any>[]
  onRowClick?: (row: T) => void
  emptyTitle?: string
  emptyDescription?: string
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="tableWrap">
      <table>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id}>
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr
              key={r.id}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              onClick={() => onRowClick?.(r.original)}
            >
              {r.getVisibleCells().map((c) => (
                <td key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

```

## src/components/layout/AppShell.tsx

`$lang
import type React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import sidebarBg from '../../assets/brand/brand-navy-bg.png'

export function AppShell() {
  return (
    <div className="appShell">
      <aside
        className="sidebar"
        style={
          {
            // Allow CSS to optionally layer a subtle brand image on top of the existing gradient.
            ['--sidebar-bg-img' as any]: `url(${sidebarBg})`,
          } as React.CSSProperties
        }
      >
        <Sidebar />
      </aside>
      <section className="main">
        <header className="topbar">
          <Topbar />
        </header>
        <div className="page">
          <Outlet />
        </div>
      </section>
    </div>
  )
}

```

## src/components/layout/Sidebar.tsx

`$lang
import { NavLink, useParams } from 'react-router-dom'
import brandLogo from '../../assets/brand/brand-logo-primary.png'

export function Sidebar() {
  const { projectId } = useParams()
  const base = projectId ? `/projects/${projectId}` : null

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
            <div className="help">Day 1 MVP (mock)</div>
          </div>
        </div>
        <div className="help">Day 1 MVP (mock)</div>
      </div>

      <nav>
        <NavLink
          to="/projects"
          className={({ isActive }) => `navItem ${isActive ? 'navItemActive' : ''}`.trim()}
        >
          Projects
        </NavLink>
        {base ? (
          <NavLink
            to={`${base}/invoices`}
            className={({ isActive }) => `navItem ${isActive ? 'navItemActive' : ''}`.trim()}
          >
            Invoices
          </NavLink>
        ) : (
          <span className="navItem navItemDisabled">Invoices</span>
        )}
        {base ? (
          <NavLink
            to={`${base}/ledger`}
            className={({ isActive }) => `navItem ${isActive ? 'navItemActive' : ''}`.trim()}
          >
            Ledger
          </NavLink>
        ) : (
          <span className="navItem navItemDisabled">Ledger</span>
        )}
        {base ? (
          <NavLink
            to={`${base}/workorders`}
            className={({ isActive }) => `navItem ${isActive ? 'navItemActive' : ''}`.trim()}
          >
            Work Orders
          </NavLink>
        ) : (
          <span className="navItem navItemDisabled">Work Orders</span>
        )}
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

```

## src/components/layout/Topbar.tsx

`$lang
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { listProjects, logout, type Project } from '../../api/client'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import brandLogo from '../../assets/brand/brand-logo-primary.png'

export function Topbar() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const { projectId } = useParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    listProjects().then(setProjects).catch(() => setProjects([]))
  }, [])

  const current = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  )

  const showProjectPicker = !pathname.startsWith('/login')

  return (
    <>
      <div className="row" style={{ minWidth: 420 }}>
        {showProjectPicker ? (
          <div className="row" style={{ width: 420, gap: 12 }}>
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
            <div style={{ width: 360 }}>
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
                  {current ? current.name : 'Select a project'}
                </option>
                {projects.map((p) => (
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
        <details
          open={menuOpen}
          onToggle={(e) => setMenuOpen((e.target as HTMLDetailsElement).open)}
          style={{ position: 'relative' }}
        >
          <summary className="userMenuSummary">
            <span className="badge badgeNavy">Admin (mock)</span>
          </summary>
          <div className="userMenuPanel">
            <div className="help" style={{ marginBottom: 10 }}>
              Signed in with mock auth.
            </div>
            <Button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                logout()
                nav('/login')
              }}
            >
              Sign out
            </Button>
          </div>
        </details>
      </div>
    </>
  )
}

```

## src/components/invoice/InvoicePreview.tsx

`$lang
import dayjs from 'dayjs'
import type { Client, Invoice, InvoiceItem, PaymentSchedule } from '../../api/client'
import { money } from '../ui/MoneyInput'

export function InvoicePreview({
  invoice,
  client,
  items,
  schedule,
}: {
  invoice: Invoice
  client: Client
  items: InvoiceItem[]
  schedule: PaymentSchedule
}) {
  const orderTotal = items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0)
  const subtotal = orderTotal - (invoice.discount ?? 0)

  return (
    <div className="docWrap">
      <div className="docPage">
        <div className="docHeader" style={{ borderBottom: '1px solid var(--c-border)', paddingBottom: 14 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div className="docH1">LEGRA&apos;S CONSTRUCTION &amp; DEVELOPMENT LLC.</div>
            <div className="docH2">Job Estimate #{invoice.invoiceNo}</div>
          </div>
          <div style={{ fontSize: 12, marginTop: 10, display: 'grid', gap: 2 }}>
            <div>
              <b>Address:</b> 700 Rice Ave, Eagle Lake, Texas, 77434
            </div>
            <div>
              <b>Phone:</b> 346 213 1203
            </div>
            <div>
              <b>Email:</b> celegrad2020@gmail.com
            </div>
          </div>
        </div>

        <div className="docMeta">
          <div className="docBox">
            <div className="docK">To:</div>
            <div className="docV">{client.name}</div>
            <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.35 }}>{client.address}</div>
          </div>
          <div className="docBox">
            <div className="docK">Prepared</div>
            <div style={{ fontSize: 12, marginTop: 6, display: 'grid', gap: 6 }}>
              <div>
                <b>Salesperson:</b> {invoice.salesperson}
              </div>
              <div>
                <b>Job:</b> {invoice.job}
              </div>
              <div>
                <b>Due date:</b> {dayjs(invoice.dueDate).format('MMM D, YYYY')}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="docMetaTable">
            <table className="docTable">
              <thead>
                <tr>
                  <th>Salesperson</th>
                  <th>Job</th>
                  <th>Shipping method</th>
                  <th>Shipping terms</th>
                  <th>Delivery date</th>
                  <th>Payment terms</th>
                  <th>Due date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{invoice.salesperson}</td>
                  <td>{invoice.job}</td>
                  <td>{invoice.shippingMethod}</td>
                  <td>{invoice.shippingTerms}</td>
                  <td>{dayjs(invoice.deliveryDate).format('MMM D, YYYY')}</td>
                  <td>{invoice.paymentTerms}</td>
                  <td>{dayjs(invoice.dueDate).format('MMM D, YYYY')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="row" style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 900 }}>Line Items</div>
            <div className="spacer" />
            <div className="help">All amounts in USD</div>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Qty</th>
                  <th>Item #</th>
                  <th>Description</th>
                  <th>Unit price</th>
                  <th>Line total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td style={{ width: 70 }}>{it.qty}</td>
                    <td>{it.itemNo}</td>
                    <td>{it.description}</td>
                    <td style={{ width: 140, textAlign: 'right' }}>{money.fmt(it.unitPrice)}</td>
                    <td style={{ width: 140, textAlign: 'right', fontWeight: 900 }}>
                      {money.fmt(it.qty * it.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'grid', justifyContent: 'end' }}>
          <div style={{ width: 320, display: 'grid', gap: 8 }}>
            <div className="row">
              <div className="muted">Order Total</div>
              <div className="spacer" />
              <div style={{ fontWeight: 900 }}>{money.fmt(orderTotal)}</div>
            </div>
            <div className="row">
              <div className="muted">DISCOUNT</div>
              <div className="spacer" />
              <div style={{ fontWeight: 900 }}>{money.fmt(invoice.discount ?? 0)}</div>
            </div>
            <div className="row" style={{ borderTop: '1px solid var(--c-border)', paddingTop: 10 }}>
              <div style={{ fontWeight: 900 }}>Sub Total</div>
              <div className="spacer" />
              <div style={{ fontWeight: 900 }}>{money.fmt(subtotal)}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Payment Schedule</div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Down Payment</th>
                  <th>Second Payment</th>
                  <th>Third Payment</th>
                  <th>Final Payment</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'right', fontWeight: 900 }}>
                    {money.fmt(schedule.downPayment)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 900 }}>
                    {money.fmt(schedule.secondPayment)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 900 }}>
                    {money.fmt(schedule.thirdPayment)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 900 }}>
                    {money.fmt(schedule.finalPayment)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="help" style={{ marginTop: 10 }}>
            Export PDF is TODO. Preview is optimized for Letter printing.
          </div>
        </div>
      </div>
    </div>
  )
}

```

## src/components/ledger/SpreadsheetGrid.tsx

`$lang
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { MoneyInput, money } from '../ui/MoneyInput'
import type { LedgerDoc, LedgerRow2, LedgerRow4 } from '../../api/client'

function sum2(rows: LedgerRow2[]) {
  return rows.reduce((s, r) => s + (Number.isFinite(r.total) ? r.total : 0), 0)
}
function sumSubCost(rows: LedgerRow4[]) {
  return rows.reduce((s, r) => s + (Number.isFinite(r.cost) ? r.cost : 0), 0)
}

export function SpreadsheetGrid({
  doc,
  onChange,
}: {
  doc: LedgerDoc
  onChange: (next: LedgerDoc) => void
}) {
  const hdTotal = sum2(doc.homeDepotLowes)
  const amzTotal = sum2(doc.amazon)
  const subTotal = sumSubCost(doc.subContractor)
  const totalGeneral = hdTotal + amzTotal + subTotal

  return (
    <div className="sheetGrid">
      <Section2
        title="Home Depot & Lowes"
        rows={doc.homeDepotLowes}
        onRows={(rows) => onChange({ ...doc, homeDepotLowes: rows })}
      />
      <Section2
        title="Amazon"
        rows={doc.amazon}
        onRows={(rows) => onChange({ ...doc, amazon: rows })}
      />
      <Section4
        title="Sub-Contractor"
        rows={doc.subContractor}
        onRows={(rows) => onChange({ ...doc, subContractor: rows })}
      />

      <div className="card">
        <div className="cardBody" style={{ display: 'grid', gap: 10 }}>
          <div className="row">
            <div className="label">Totals</div>
          </div>
          <div className="row">
            <div className="muted">Total HD + Lowes</div>
            <div className="spacer" />
            <div style={{ fontWeight: 900 }}>{money.fmt(hdTotal)}</div>
          </div>
          <div className="row">
            <div className="muted">Total Amazon</div>
            <div className="spacer" />
            <div style={{ fontWeight: 900 }}>{money.fmt(amzTotal)}</div>
          </div>
          <div className="row">
            <div className="muted">Total Subcontractors</div>
            <div className="spacer" />
            <div style={{ fontWeight: 900 }}>{money.fmt(subTotal)}</div>
          </div>
          <div className="row" style={{ borderTop: '1px solid var(--c-border)', paddingTop: 10 }}>
            <div style={{ fontWeight: 900 }}>Total General</div>
            <div className="spacer" />
            <div style={{ fontWeight: 900 }}>{money.fmt(totalGeneral)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section2({
  title,
  rows,
  onRows,
}: {
  title: string
  rows: LedgerRow2[]
  onRows: (rows: LedgerRow2[]) => void
}) {
  return (
    <div className="sheetSection">
      <div className="sheetSectionHeader">
        <div className="sheetSectionTitle">{title}</div>
        <Button
          type="button"
          onClick={() =>
            onRows([
              ...rows,
              { id: `row_${crypto.randomUUID()}`, item: 'New item', total: 0 },
            ])
          }
        >
          Add Row
        </Button>
      </div>
      <div
        className="sheetRow sheetRow2"
        style={{
          background: 'rgba(14, 28, 40, 0.03)',
          borderBottom: '1px solid var(--c-border)',
          fontWeight: 900,
        }}
      >
        <div className="label" style={{ marginTop: 6 }}>
          TASK / ITEM
        </div>
        <div className="label" style={{ marginTop: 6, textAlign: 'right' }}>
          TOTAL
        </div>
      </div>
      {rows.map((r, idx) => (
        <div key={r.id} className="sheetRow sheetRow2">
          <Input
            value={r.item}
            onChange={(e) => {
              const next = [...rows]
              next[idx] = { ...r, item: e.target.value }
              onRows(next)
            }}
          />
          <MoneyInput
            value={r.total}
            onChange={(n) => {
              const next = [...rows]
              next[idx] = { ...r, total: n }
              onRows(next)
            }}
          />
        </div>
      ))}
    </div>
  )
}

function Section4({
  title,
  rows,
  onRows,
}: {
  title: string
  rows: LedgerRow4[]
  onRows: (rows: LedgerRow4[]) => void
}) {
  return (
    <div className="sheetSection">
      <div className="sheetSectionHeader">
        <div className="sheetSectionTitle">{title}</div>
        <Button
          type="button"
          onClick={() =>
            onRows([
              ...rows,
              {
                id: `row_${crypto.randomUUID()}`,
                job: 'New subcontractor',
                cost: 0,
                paid: 0,
                reminder: '',
              },
            ])
          }
        >
          Add Row
        </Button>
      </div>
      <div
        className="sheetRow sheetRow4"
        style={{
          background: 'rgba(14, 28, 40, 0.03)',
          borderBottom: '1px solid var(--c-border)',
          fontWeight: 900,
        }}
      >
        <div className="label" style={{ marginTop: 6 }}>
          Sub-Contrator
        </div>
        <div className="label" style={{ marginTop: 6, textAlign: 'right' }}>
          Cost
        </div>
        <div className="label" style={{ marginTop: 6, textAlign: 'right' }}>
          Sub- Cont. Paid
        </div>
        <div className="label" style={{ marginTop: 6 }}>
          REMINDER
        </div>
      </div>
      {rows.map((r, idx) => (
        <div key={r.id} className="sheetRow sheetRow4">
          <Input
            value={r.job}
            onChange={(e) => {
              const next = [...rows]
              next[idx] = { ...r, job: e.target.value }
              onRows(next)
            }}
          />
          <MoneyInput
            value={r.cost}
            onChange={(n) => {
              const next = [...rows]
              next[idx] = { ...r, cost: n }
              onRows(next)
            }}
          />
          <MoneyInput
            value={r.paid}
            onChange={(n) => {
              const next = [...rows]
              next[idx] = { ...r, paid: n }
              onRows(next)
            }}
          />
          <Input
            value={r.reminder}
            placeholder="Reminder"
            onChange={(e) => {
              const next = [...rows]
              next[idx] = { ...r, reminder: e.target.value }
              onRows(next)
            }}
          />
        </div>
      ))}
    </div>
  )
}

```

## src/pages/LoginPage.tsx

`$lang
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/client'
import { Card, CardBody } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import brandLogo from '../assets/brand/brand-logo-primary.png'
import brandNavyBg from '../assets/brand/brand-navy-bg.png'

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const nav = useNavigate()
  const [err, setErr] = useState<string | null>(null)

  const defaults = useMemo<FormValues>(
    () => ({ username: 'admin', password: 'admin' }),
    [],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults })

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        backgroundImage: `url(${brandNavyBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div style={{ width: 520, maxWidth: '100%' }}>
        <Card>
          <div className="cardHeader">
            <div className="row">
              <img
                src={brandLogo}
                alt="Legra's"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  border: '1px solid var(--c-border)',
                  objectFit: 'cover',
                }}
              />
              <div>
                <h1 className="hTitle">Legra's Admin</h1>
                <p className="hSub">Mock login (Day 1). Username: admin / Password: admin</p>
              </div>
            </div>
          </div>
          <CardBody>
            <form
              onSubmit={handleSubmit(async (v) => {
                setErr(null)
                try {
                  await login(v.username, v.password)
                  nav('/projects')
                } catch (e) {
                  setErr(e instanceof Error ? e.message : 'Login failed')
                }
              })}
              style={{ display: 'grid', gap: 14 }}
            >
              <div className="field">
                <div className="label">Username</div>
                <Input placeholder="admin" {...register('username')} autoComplete="username" />
                {errors.username ? <div className="error">{errors.username.message}</div> : null}
              </div>

              <div className="field">
                <div className="label">Password</div>
                <Input type="password" {...register('password')} autoComplete="current-password" />
                {errors.password ? <div className="error">{errors.password.message}</div> : null}
              </div>

              {err ? <div className="bannerDanger">{err}</div> : null}

              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  Sign in
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}


```

## src/pages/ProjectsListPage.tsx

`$lang
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createProject,
  listClients,
  listProjects,
  type Client,
  type Project,
  type ProjectStatus,
} from '../api/client'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { DataTable } from '../components/tables/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { StatusBadge } from '../components/ui/StatusBadge'
import { money } from '../components/ui/MoneyInput'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'

const schema = z.object({
  projectName: z.string().min(2),
  clientName: z.string().min(2),
  clientAddress: z.string().min(5),
  jobAddress: z.string().min(5),
  status: z.enum(['Active', 'Planning', 'Completed', 'On Hold']),
  budgetTotal: z.number().min(0),
  revenue: z.number().min(0),
})

type FormValues = z.infer<typeof schema>

export function ProjectsListPage() {
  const nav = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectName: '',
      clientName: '',
      clientAddress: '',
      jobAddress: '',
      status: 'Planning',
      budgetTotal: 0,
      revenue: 0,
    },
  })

  async function refresh() {
    await Promise.all([
      listProjects().then(setProjects).catch(() => setProjects([])),
      listClients().then(setClients).catch(() => setClients([])),
    ])
  }

  useEffect(() => {
    refresh()
  }, [])

  const clientName = useMemo(() => {
    const map = new Map(clients.map((c) => [c.id, c.name]))
    return (id: string) => map.get(id) ?? 'Unknown'
  }, [clients])

  const cols = useMemo<ColumnDef<Project>[]>(
    () => [
      { header: 'Project', accessorKey: 'name' },
      {
        header: 'Client',
        cell: ({ row }) => <span>{clientName(row.original.clientId)}</span>,
      },
      { header: 'Job Address', accessorKey: 'jobAddress' },
      {
        header: 'Budget',
        cell: ({ row }) => <span>{money.fmt(row.original.budgetTotal)}</span>,
      },
      {
        header: 'Revenue',
        cell: ({ row }) => <span>{money.fmt(row.original.revenue)}</span>,
      },
      {
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    [clientName],
  )

  return (
    <Card>
      <CardHeader
        title="Dashboard"
        subtitle="Projects (mock). Create a project to get started."
        right={
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              reset()
              setOpen(true)
            }}
          >
            Create Project
          </Button>
        }
      />
      <CardBody>
        <DataTable
          data={projects}
          columns={cols}
          onRowClick={(p) => nav(`/projects/${p.id}`)}
          emptyTitle="No projects"
          emptyDescription="Create your first project to start invoices, ledger, and work orders."
        />
      </CardBody>

      <Modal
        title="Create Project (Mock)"
        open={open}
        onClose={() => setOpen(false)}
      >
        <form
          onSubmit={handleSubmit(async (v) => {
            const p = await createProject({
              projectName: v.projectName,
              clientName: v.clientName,
              clientAddress: v.clientAddress,
              jobAddress: v.jobAddress,
              status: v.status as ProjectStatus,
              budgetTotal: v.budgetTotal,
              revenue: v.revenue,
            })
            setOpen(false)
            await refresh()
            nav(`/projects/${p.id}`)
          })}
          style={{ display: 'grid', gap: 14 }}
        >
          <div className="grid2">
            <div className="field">
              <div className="label">Project name</div>
              <Input placeholder="e.g. Garage to APT" {...register('projectName')} />
              {errors.projectName ? <div className="error">{errors.projectName.message}</div> : null}
            </div>
            <div className="field">
              <div className="label">Status</div>
              <Select {...register('status')}>
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </Select>
            </div>
          </div>

          <div className="grid2">
            <div className="field">
              <div className="label">Client name</div>
              <Input placeholder="Client" {...register('clientName')} />
              {errors.clientName ? <div className="error">{errors.clientName.message}</div> : null}
            </div>
            <div className="field">
              <div className="label">Client address</div>
              <Input placeholder="Client address" {...register('clientAddress')} />
              {errors.clientAddress ? <div className="error">{errors.clientAddress.message}</div> : null}
            </div>
          </div>

          <div className="field">
            <div className="label">Job address</div>
            <Input placeholder="Job location address" {...register('jobAddress')} />
            {errors.jobAddress ? <div className="error">{errors.jobAddress.message}</div> : null}
          </div>

          <div className="grid2">
            <div className="field">
              <div className="label">Budget</div>
              <Input type="number" min={0} step="0.01" {...register('budgetTotal', { valueAsNumber: true })} />
              {errors.budgetTotal ? <div className="error">{errors.budgetTotal.message}</div> : null}
            </div>
            <div className="field">
              <div className="label">Revenue</div>
              <Input type="number" min={0} step="0.01" {...register('revenue', { valueAsNumber: true })} />
              {errors.revenue ? <div className="error">{errors.revenue.message}</div> : null}
            </div>
          </div>

          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  )
}

```

## src/pages/ProjectDetailPage.tsx

`$lang
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getClient,
  getProject,
  getRetailSnapshots,
  type Client,
  type Project,
} from '../api/client'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import { money } from '../components/ui/MoneyInput'
import { Button } from '../components/ui/Button'

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [poItems, setPoItems] = useState<string[]>([])
  const [poColor, setPoColor] = useState<string>('')

  useEffect(() => {
    if (!projectId) return
    getProject(projectId).then(setProject)
  }, [projectId])

  useEffect(() => {
    if (!project?.clientId) return
    getClient(project.clientId).then(setClient)
  }, [project?.clientId])

  useEffect(() => {
    if (!projectId) return
    getRetailSnapshots()
      .then((snap) => {
        const po = snap.purchaseOrders.find((p) => p.projectId === projectId)
        setPoItems(po?.items ?? [])
        setPoColor(po?.color ?? '')
      })
      .catch(() => {
        setPoItems([])
        setPoColor('')
      })
  }, [projectId])

  const quick = useMemo(() => {
    if (!projectId) return []
    const base = `/projects/${projectId}`
    return [
      { to: `${base}/invoices`, label: 'Invoices' },
      { to: `${base}/ledger`, label: 'Ledger' },
      { to: `${base}/workorders`, label: 'Work Orders' },
    ]
  }, [projectId])

  if (!projectId) return null

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Card>
        <CardHeader
          title={project?.name ?? 'Project'}
          subtitle={client ? `Client: ${client.name}` : 'Loading client...'}
          right={project ? <StatusBadge status={project.status} /> : null}
        />
        <CardBody>
          <div className="grid2">
            <Card className="">
              <div className="cardBody">
                <div className="label">Job Location</div>
                <div style={{ fontWeight: 800, marginTop: 6 }}>{project?.jobAddress ?? '-'}</div>
                <div className="help" style={{ marginTop: 6 }}>
                  Job phone: {project?.jobPhone ?? '-'}
                </div>
                <div className="help">Appt date: {project?.apptDate ?? '-'}</div>
              </div>
            </Card>

            <Card className="">
              <div className="cardBody">
                <div className="label">Budget Summary</div>
                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  <div className="row">
                    <div className="muted">Revenue</div>
                    <div className="spacer" />
                    <div style={{ fontWeight: 900 }}>{money.fmt(project?.revenue ?? 0)}</div>
                  </div>
                  <div className="row">
                    <div className="muted">Budget</div>
                    <div className="spacer" />
                    <div style={{ fontWeight: 900 }}>{money.fmt(project?.budgetTotal ?? 0)}</div>
                  </div>
                  <div className="row">
                    <div className="muted">Customer paid</div>
                    <div className="spacer" />
                    <div style={{ fontWeight: 900 }}>{money.fmt(project?.customerPaid ?? 0)}</div>
                  </div>
                </div>
                {project?.reminder ? (
                  <div style={{ marginTop: 12 }} className="bannerDanger">
                    Reminder: {project.reminder}
                  </div>
                ) : null}
              </div>
            </Card>
          </div>

          <div className="row" style={{ marginTop: 18 }}>
            {quick.map((q) => (
              <Link key={q.to} to={q.to}>
                <Button type="button" variant="primary">
                  {q.label}
                </Button>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Purchase List (PO Mock)"
          subtitle={poColor ? `Color: ${poColor}` : 'Mock from provided PO list'}
        />
        <CardBody>
          {poItems.length ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {poItems.map((x) => (
                <div key={x} className="row">
                  <span className="badge badgeGold">{x}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="help">No PO items for this project.</div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}


```

## src/pages/InvoicesListPage.tsx

`$lang
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
        subtitle="Project invoices/estimates (mock)"
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

```

## src/pages/InvoiceDetailPage.tsx

`$lang
import { useEffect, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getClient,
  getInvoice,
  getPaymentSchedule,
  getProject,
  listInvoiceItems,
  saveInvoice,
  saveInvoiceItems,
  savePaymentSchedule,
  type Client,
  type Invoice,
  type InvoiceItem,
  type PaymentSchedule,
  type Project,
} from '../api/client'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { MoneyInput, money } from '../components/ui/MoneyInput'
import { InvoicePreview } from '../components/invoice/InvoicePreview'

const itemSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  qty: z.number().min(0),
  itemNo: z.string().min(1),
  description: z.string().min(1),
  unitPrice: z.number().min(0),
})

const scheduleSchema = z.object({
  invoiceId: z.string(),
  downPayment: z.number().min(0),
  secondPayment: z.number().min(0),
  thirdPayment: z.number().min(0),
  finalPayment: z.number().min(0),
})

const schema = z.object({
  invoice: z.object({
    id: z.string(),
    projectId: z.string(),
    invoiceNo: z.string().min(1),
    type: z.enum(['Estimate', 'Invoice']),
    status: z.enum(['Draft', 'Sent', 'Paid', 'Voided']),
    salesperson: z.string().min(1),
    job: z.string().min(1),
    shippingMethod: z.string(),
    shippingTerms: z.string(),
    deliveryDate: z.string().min(1),
    paymentTerms: z.string(),
    dueDate: z.string().min(1),
    discount: z.number().min(0),
  }),
  items: z.array(itemSchema).min(1),
  schedule: scheduleSchema,
})

type FormValues = z.infer<typeof schema>

export function InvoiceDetailPage() {
  const nav = useNavigate()
  const { projectId, invoiceId } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: undefined,
    mode: 'onChange',
  })

  const { control, register, watch, setValue, handleSubmit, formState } = form

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    if (!projectId) return
    getProject(projectId).then(setProject)
  }, [projectId])

  useEffect(() => {
    if (!project?.clientId) return
    getClient(project.clientId).then(setClient)
  }, [project?.clientId])

  useEffect(() => {
    let alive = true
    async function load() {
      if (!invoiceId) return
      setLoading(true)
      const inv = await getInvoice(invoiceId)
      const items = await listInvoiceItems(invoiceId)
      const schedule = await getPaymentSchedule(invoiceId)
      if (!alive) return
      if (!inv || !schedule) {
        setLoading(false)
        return
      }
      form.reset({ invoice: inv, items, schedule })
      setLoading(false)
    }
    load().catch(() => setLoading(false))
    return () => {
      alive = false
    }
  }, [invoiceId, form])

  const inv = watch('invoice') as Invoice | undefined
  const items = watch('items') as InvoiceItem[] | undefined
  const schedule = watch('schedule') as PaymentSchedule | undefined

  const totals = useMemo(() => {
    const orderTotal = (items ?? []).reduce((sum, it) => sum + it.qty * it.unitPrice, 0)
    const discount = inv?.discount ?? 0
    const subtotal = orderTotal - discount
    const paySum =
      (schedule?.downPayment ?? 0) +
      (schedule?.secondPayment ?? 0) +
      (schedule?.thirdPayment ?? 0) +
      (schedule?.finalPayment ?? 0)
    return { orderTotal, discount, subtotal, paySum }
  }, [inv?.discount, items, schedule])

  const scheduleMismatch = Math.abs(totals.paySum - totals.subtotal) > 0.009

  if (!projectId || !invoiceId) return null

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Card>
        <CardHeader
          title={`Invoice / Estimate #${inv?.invoiceNo ?? ''}`}
          subtitle={project ? project.name : 'Loading project...'}
          right={
            <div className="row">
              <Button
                type="button"
                onClick={() => nav(`/projects/${projectId}/invoices`)}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  // TODO: real PDF export. Day 1 behavior: open print dialog (user can "Save as PDF").
                  window.print()
                }}
              >
                Export PDF (TODO)
              </Button>
            </div>
          }
        />
        <CardBody>
          {scheduleMismatch ? (
            <div className="bannerDanger">
              Payment schedule sum {money.fmt(totals.paySum)} does not match Sub Total{' '}
              {money.fmt(totals.subtotal)}. Mark as Sent is blocked (intentional).
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="invoiceTwoCol">
        <Card>
          <CardHeader
            title="Editor"
            subtitle="Items, discount, metadata, schedule"
            right={
              <div className="row">
                <Button
                  type="button"
                  variant="primary"
                  disabled={loading || formState.isSubmitting}
                  onClick={handleSubmit(async (v) => {
                    await saveInvoice(v.invoice)
                    await saveInvoiceItems(v.invoice.id, v.items)
                    await savePaymentSchedule(v.schedule)
                  })}
                >
                  Save (mock)
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={scheduleMismatch || loading}
                  onClick={handleSubmit(async (v) => {
                    await saveInvoice({ ...v.invoice, status: 'Sent' })
                    await saveInvoiceItems(v.invoice.id, v.items)
                    await savePaymentSchedule(v.schedule)
                    setValue('invoice.status', 'Sent')
                  })}
                >
                  Mark as Sent
                </Button>
              </div>
            }
          />
          <CardBody>
            <form style={{ display: 'grid', gap: 18 }}>
              <div className="grid2">
                <div className="field">
                  <div className="label">Invoice / Estimate #</div>
                  <Input {...register('invoice.invoiceNo')} />
                </div>
                <div className="field">
                  <div className="label">Status</div>
                  <Input value={inv?.status ?? ''} disabled />
                </div>
                <div className="field">
                  <div className="label">Salesperson</div>
                  <Input {...register('invoice.salesperson')} />
                </div>
                <div className="field">
                  <div className="label">Job</div>
                  <Input {...register('invoice.job')} />
                </div>
              </div>

              <Card>
                <div className="cardBody" style={{ display: 'grid', gap: 14 }}>
                  <div className="label">Metadata (7 columns)</div>
                  <div className="grid2">
                    <div className="field">
                      <div className="label">Shipping method</div>
                      <Input {...register('invoice.shippingMethod')} />
                    </div>
                    <div className="field">
                      <div className="label">Shipping terms</div>
                      <Input {...register('invoice.shippingTerms')} />
                    </div>
                    <div className="field">
                      <div className="label">Delivery date</div>
                      <Input type="date" {...register('invoice.deliveryDate')} />
                    </div>
                    <div className="field">
                      <div className="label">Payment terms</div>
                      <Input {...register('invoice.paymentTerms')} />
                    </div>
                    <div className="field">
                      <div className="label">Due date</div>
                      <Input type="date" {...register('invoice.dueDate')} />
                    </div>
                    <div className="field">
                      <div className="label">Discount</div>
                      <Controller
                        control={control}
                        name="invoice.discount"
                        render={({ field }) => (
                          <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
                        )}
                      />
                    </div>
                    <div className="field">
                      <div className="label">Computed Sub Total</div>
                      <Input value={money.fmt(totals.subtotal)} disabled />
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="cardBody" style={{ display: 'grid', gap: 10 }}>
                  <div className="row">
                    <div className="label">Line items</div>
                    <div className="spacer" />
                    <Button
                      type="button"
                      onClick={() =>
                        append({
                          id: `item_${crypto.randomUUID()}`,
                          invoiceId,
                          qty: 1,
                          itemNo: 'NEW',
                          description: 'New item',
                          unitPrice: 0,
                        })
                      }
                    >
                      Add Item
                    </Button>
                  </div>

                  <div className="tableWrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Qty</th>
                          <th>Item #</th>
                          <th>Description</th>
                          <th>Unit price</th>
                          <th>Line total</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((f, idx) => {
                          const qty = watch(`items.${idx}.qty`) ?? 0
                          const unitPrice = watch(`items.${idx}.unitPrice`) ?? 0
                          return (
                            <tr key={f.id}>
                              <td style={{ width: 90 }}>
                                <Input
                                  type="number"
                                  min={0}
                                  step={1}
                                  {...register(`items.${idx}.qty`, { valueAsNumber: true })}
                                />
                              </td>
                              <td style={{ width: 170 }}>
                                <Input {...register(`items.${idx}.itemNo`)} />
                              </td>
                              <td>
                                <Input {...register(`items.${idx}.description`)} />
                              </td>
                              <td style={{ width: 200 }}>
                                <Controller
                                  control={control}
                                  name={`items.${idx}.unitPrice`}
                                  render={({ field }) => (
                                    <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
                                  )}
                                />
                              </td>
                              <td style={{ width: 170, fontWeight: 900 }}>
                                {money.fmt(qty * unitPrice)}
                              </td>
                              <td style={{ width: 60 }}>
                                <Button type="button" onClick={() => remove(idx)}>
                                  X
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <div className="muted">Order Total:</div>
                    <div style={{ fontWeight: 900 }}>{money.fmt(totals.orderTotal)}</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="cardBody" style={{ display: 'grid', gap: 14 }}>
                  <div className="label">Payment schedule</div>
                  <div className="grid2">
                    <div className="field">
                      <div className="label">Down Payment</div>
                      <Controller
                        control={control}
                        name="schedule.downPayment"
                        render={({ field }) => (
                          <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
                        )}
                      />
                    </div>
                    <div className="field">
                      <div className="label">Second Payment</div>
                      <Controller
                        control={control}
                        name="schedule.secondPayment"
                        render={({ field }) => (
                          <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
                        )}
                      />
                    </div>
                    <div className="field">
                      <div className="label">Third Payment</div>
                      <Controller
                        control={control}
                        name="schedule.thirdPayment"
                        render={({ field }) => (
                          <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
                        )}
                      />
                    </div>
                    <div className="field">
                      <div className="label">Final Payment</div>
                      <Controller
                        control={control}
                        name="schedule.finalPayment"
                        render={({ field }) => (
                          <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
                        )}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="muted">Schedule sum:</div>
                    <div style={{ fontWeight: 900 }}>{money.fmt(totals.paySum)}</div>
                    <div className="spacer" />
                    <div className="muted">Must equal Sub Total:</div>
                    <div style={{ fontWeight: 900 }}>{money.fmt(totals.subtotal)}</div>
                  </div>
                </div>
              </Card>

              {Object.keys(formState.errors).length ? (
                <div className="help">Fix validation errors before saving.</div>
              ) : null}
            </form>
          </CardBody>
        </Card>

        <div>
          <Card>
            <CardHeader title="Preview (Letter)" subtitle="Printable document-style preview" />
            <CardBody>
              {inv && items && schedule && client ? (
                <InvoicePreview invoice={inv} items={items} schedule={schedule} client={client} />
              ) : (
                <div className="help">Loading preview...</div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

```

## src/pages/LedgerPage.tsx

`$lang
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getLedger, getProject, saveLedger, type LedgerDoc, type Project } from '../api/client'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SpreadsheetGrid } from '../components/ledger/SpreadsheetGrid'
import { money } from '../components/ui/MoneyInput'

function headerValue(label: string, value: string) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="label">{label}</div>
      <div style={{ fontWeight: 900, marginTop: 6 }}>{value}</div>
    </div>
  )
}

export function LedgerPage() {
  const { projectId } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [doc, setDoc] = useState<LedgerDoc | null>(null)

  useEffect(() => {
    if (!projectId) return
    getProject(projectId).then(setProject)
    getLedger(projectId).then((d) => {
      if (d) setDoc(d)
      else {
        setDoc({
          projectId,
          homeDepotLowes: [],
          amazon: [],
          subContractor: [],
        })
      }
    })
  }, [projectId])

  const headerCards = useMemo(() => {
    return (
      <div className="grid2" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {headerValue('JOB NAME', project?.name ?? '-')}
        {headerValue('APPT DATE', project?.apptDate ?? '-')}
        {headerValue('JOB PHONE', project?.jobPhone ?? '-')}
        {headerValue('Revenue', money.fmt(project?.revenue ?? 0))}
        {headerValue('Budget', money.fmt(project?.budgetTotal ?? 0))}
        {headerValue('Costumer Paid', money.fmt(project?.customerPaid ?? 0))}
        {headerValue('REMINDER', project?.reminder ?? '-')}
      </div>
    )
  }, [project])

  if (!projectId) return null

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Card>
        <CardHeader
          title="Ledger"
          subtitle="Spreadsheet-style grid (mock)"
          right={
            <Button
              type="button"
              variant="primary"
              onClick={async () => {
                if (!doc) return
                await saveLedger(doc)
              }}
              disabled={!doc}
            >
              Save (mock)
            </Button>
          }
        />
        <CardBody>{headerCards}</CardBody>
      </Card>

      <Card>
        <CardHeader title="Spreadsheet" subtitle="Editable sections with automatic totals" />
        <CardBody>
          {doc ? (
            <SpreadsheetGrid doc={doc} onChange={setDoc} />
          ) : (
            <div className="help">Loading ledger...</div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

```

## src/pages/WorkOrdersListPage.tsx

`$lang
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { createWorkOrder, listWorkOrders, type WorkOrder } from '../api/client'
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
        subtitle="Daily/weekly work tracking (mock)"
        right={
          <Button
            type="button"
            variant="primary"
            onClick={async () => {
              const wo = await createWorkOrder(projectId)
              nav(`/projects/${projectId}/workorders/${wo.id}`)
            }}
          >
            Create (mock)
          </Button>
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

```

## src/pages/WorkOrderDetailPage.tsx

`$lang
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getWorkOrder, saveWorkOrder, type WorkOrder } from '../api/client'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { FileUploadMock, type UploadMockFile } from '../components/ui/FileUploadMock'

export function WorkOrderDetailPage() {
  const nav = useNavigate()
  const { projectId, workOrderId } = useParams()
  const [wo, setWo] = useState<WorkOrder | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!workOrderId) return
    getWorkOrder(workOrderId).then(setWo)
  }, [workOrderId])

  const assignedCsv = useMemo(() => (wo?.assignedTo ?? []).join(', '), [wo?.assignedTo])

  if (!projectId || !workOrderId) return null

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Card>
        <CardHeader
          title="Work Order"
          subtitle="Header + checklist + notes + media (mock)"
          right={
            <div className="row">
              <Button type="button" onClick={() => nav(`/projects/${projectId}/workorders`)}>
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!wo}
                onClick={async () => {
                  if (!wo) return
                  await saveWorkOrder(wo)
                }}
              >
                Save (mock)
              </Button>
            </div>
          }
        />
        <CardBody>
          {wo ? (
            <div className="grid2">
              <div className="field">
                <div className="label">Title</div>
                <Input value={wo.title} onChange={(e) => setWo({ ...wo, title: e.target.value })} />
              </div>
              <div className="field">
                <div className="label">Priority</div>
                <Select
                  value={wo.priority}
                  onChange={(e) => setWo({ ...wo, priority: e.target.value as WorkOrder['priority'] })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Select>
              </div>
              <div className="field">
                <div className="label">Start date</div>
                <Input
                  type="date"
                  value={wo.startDate}
                  onChange={(e) => setWo({ ...wo, startDate: e.target.value })}
                />
              </div>
              <div className="field">
                <div className="label">End date</div>
                <Input
                  type="date"
                  value={wo.endDate}
                  onChange={(e) => setWo({ ...wo, endDate: e.target.value })}
                />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <div className="label">Assigned (comma-separated)</div>
                <Input
                  value={assignedCsv}
                  placeholder="Celso, Crew A"
                  onChange={(e) =>
                    setWo({
                      ...wo,
                      assignedTo: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            </div>
          ) : (
            <div className="help">Loading...</div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Checklist" subtitle="Toggle completed items" />
        <CardBody>
          {wo ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {wo.checklist.map((c) => (
                <label
                  key={c.id}
                  className="row"
                  style={{
                    border: '1px solid var(--c-border)',
                    borderRadius: '14px',
                    padding: '10px 12px',
                    background: c.done ? 'rgba(220, 175, 54, 0.12)' : 'rgba(255,255,255,0.8)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={c.done}
                    onChange={() =>
                      setWo({
                        ...wo,
                        checklist: wo.checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)),
                      })
                    }
                  />
                  <span style={{ fontWeight: 800 }}>{c.text}</span>
                </label>
              ))}
              <Button
                type="button"
                onClick={() =>
                  setWo({
                    ...wo,
                    checklist: [
                      ...wo.checklist,
                      { id: `c_${crypto.randomUUID()}`, text: 'New checklist item', done: false },
                    ],
                  })
                }
              >
                Add item
              </Button>
            </div>
          ) : (
            <div className="help">Loading...</div>
          )}
        </CardBody>
      </Card>

      <div className="grid2">
        <Card>
          <CardHeader title="Notes" subtitle="Simple notes feed (mock)" />
          <CardBody>
            {wo ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  {wo.notes.length ? (
                    wo.notes.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          border: '1px solid var(--c-border)',
                          borderRadius: '14px',
                          padding: '12px',
                          background: 'rgba(255,255,255,0.85)',
                        }}
                      >
                        <div className="row">
                          <span className="badge badgeNavy">{n.author}</span>
                          <span className="help">{new Date(n.at).toLocaleString()}</span>
                        </div>
                        <div style={{ marginTop: 8, fontWeight: 700 }}>{n.text}</div>
                      </div>
                    ))
                  ) : (
                    <div className="help">No notes yet.</div>
                  )}
                </div>

                <div className="field">
                  <div className="label">Add note</div>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Type a note..." />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  disabled={!note.trim()}
                  onClick={() => {
                    const next = {
                      id: `n_${crypto.randomUUID()}`,
                      at: new Date().toISOString(),
                      author: 'Admin',
                      text: note.trim(),
                    }
                    setWo({ ...wo, notes: [next, ...wo.notes] })
                    setNote('')
                  }}
                >
                  Add note
                </Button>
              </div>
            ) : (
              <div className="help">Loading...</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Media" subtitle="Upload media (mock)" />
          <CardBody>
            {wo ? (
              <div style={{ display: 'grid', gap: 14 }}>
                <FileUploadMock
                  onAdd={(files: UploadMockFile[]) => {
                    setWo({
                      ...wo,
                      media: [
                        ...files.map((f) => ({ id: f.id, name: f.name, previewUrl: f.previewUrl })),
                        ...wo.media,
                      ],
                    })
                  }}
                />
                <div className="thumbs">
                  {wo.media.map((m) => (
                    <img key={m.id} className="thumb" src={m.previewUrl} alt={m.name} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="help">Loading...</div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}


```

## src/mock/auth.json

`$lang
{
  "defaultUser": {
    "id": "usr_001",
    "name": "Admin (Mock)",
    "email": "admin@legra.mock"
  },
  "token": "mock-token"
}


```

## src/mock/projects.json

`$lang
[
  {
    "id": "proj_adalberto",
    "name": "Adalberto 3 Plex Trailer Conversion",
    "clientId": "cli_adalberto",
    "status": "Active",
    "jobAddress": "700 Rice Ave, Eagle Lake, Texas, 77434",
    "jobPhone": "346 213 1203",
    "apptDate": "2023-11-15",
    "budgetTotal": 80750,
    "revenue": 118875,
    "customerPaid": 0,
    "reminder": "Payment schedule does not match subtotal (intentional)."
  },
  {
    "id": "proj_mock_002",
    "name": "Kitchen Refresh (Mock)",
    "clientId": "cli_spences",
    "status": "Planning",
    "jobAddress": "Eagle Lake, TX",
    "jobPhone": "",
    "apptDate": "2024-02-01",
    "budgetTotal": 25000,
    "revenue": 34000,
    "customerPaid": 10000,
    "reminder": ""
  }
]


```

## src/mock/clients.json

`$lang
[
  {
    "id": "cli_adalberto",
    "name": "Adalberto",
    "address": "29057 Bonilla Ln, Katy, TX 77493",
    "phone": ""
  },
  {
    "id": "cli_spences",
    "name": "Spences (Mock)",
    "address": "Katy, TX",
    "phone": ""
  }
]


```

## src/mock/invoices.json

`$lang
[
  {
    "id": "inv_324",
    "projectId": "proj_adalberto",
    "invoiceNo": "324",
    "type": "Estimate",
    "status": "Draft",
    "salesperson": "Celso Legra",
    "job": "3 Plex Trailer Conversion",
    "shippingMethod": "N/A",
    "shippingTerms": "N/A",
    "deliveryDate": "2023-12-01",
    "paymentTerms": "Per schedule",
    "dueDate": "2023-12-01",
    "discount": 38125
  }
]


```

## src/mock/invoiceItems.json

`$lang
[
  {
    "id": "item_001",
    "invoiceId": "inv_324",
    "qty": 3,
    "itemNo": "001-Apt #1 4110",
    "description": "Apt #1 4110",
    "unitPrice": 34875
  },
  {
    "id": "item_002",
    "invoiceId": "inv_324",
    "qty": 1,
    "itemNo": "002-Exterior Trailer Remodeling",
    "description": "Exterior Trailer Remodeling",
    "unitPrice": 14250
  }
]


```

## src/mock/budgets.json

`$lang
[
  {
    "projectId": "proj_adalberto",
    "budgetTotal": 80750,
    "revenue": 118875,
    "customerPaid": 0,
    "reminder": "Bring payment schedule into alignment before sending."
  }
]


```

## src/mock/payments.json

`$lang
[
  {
    "invoiceId": "inv_324",
    "downPayment": 750,
    "secondPayment": 20000,
    "thirdPayment": 20000,
    "finalPayment": 40000
  }
]


```

## src/mock/ledger.json

`$lang
[
  {
    "projectId": "proj_adalberto",
    "homeDepotLowes": [
      { "id": "hdl_1", "item": "Drywall + compound", "total": 1865.42 },
      { "id": "hdl_2", "item": "Fasteners", "total": 214.19 }
    ],
    "amazon": [
      { "id": "amz_1", "item": "Lighting fixtures", "total": 392.88 }
    ],
    "subContractor": [
      { "id": "sub_1", "job": "Electrical rough-in", "cost": 2800, "paid": 1500, "reminder": "Balance after inspection" },
      { "id": "sub_2", "job": "Plumbing", "cost": 2200, "paid": 0, "reminder": "Schedule ASAP" }
    ]
  }
]


```

## src/mock/workorders.json

`$lang
[
  {
    "id": "wo_001",
    "projectId": "proj_adalberto",
    "title": "Week 1: Demo + Rough-in",
    "status": "In Progress",
    "priority": "High",
    "startDate": "2023-11-15",
    "endDate": "2023-11-19",
    "assignedTo": ["Celso", "Crew A"],
    "checklist": [
      { "id": "c1", "text": "Demo old interior", "done": true },
      { "id": "c2", "text": "Frame partition walls", "done": false },
      { "id": "c3", "text": "Electrical rough-in", "done": false }
    ],
    "notes": [
      { "id": "n1", "at": "2023-11-15T10:00:00Z", "author": "Admin", "text": "Kickoff confirmed for 11/15." }
    ],
    "media": []
  }
]


```

## src/mock/retailSnapshots.json

`$lang
{
  "purchaseOrders": [
    {
      "id": "po_cabinets_adalberto",
      "projectId": "proj_adalberto",
      "vendor": "Cabinets (Mock PO)",
      "color": "Houston Frost",
      "items": ["HF-SB30", "HF-HF-B24", "HF-B30", "HF-W3030 x2", "HF-W2412 x2", "VB2421", "HF-TK8"]
    }
  ]
}


```

## src/assets/brand/ASSETS_TODO.md

`$lang
# Brand Assets (TODO)

The following files were specified to be copied into `src/assets/brand/`, but were not found on this machine under the provided `/mnt/data/...` paths (not present on Windows).

Placeholders have been created for the exact filenames required by the spec (so the repo is complete on Day 1).

If you have the original assets, replace the placeholder files in this folder with the originals:

- `7F98A698-4342-48C8-8290-39E19BCFC45F.jpeg`
- `893FC353-7CCE-4B81-A144-5AD45A945725.png`
- `243B4DC8-8A24-4771-943B-FAB84F6FA767.png`
- `C461D087-C95F-4C51-8072-9BCCDA0E894B.png`
- `EB372117-4801-4F0A-B609-E9CD6155C5DC.png`
- `B4C9FE88-7387-453C-8F37-EDB8966F3C1B.png`
- `3D8229EB-66BA-41F9-83DE-994E09F6D262.png`
- `96907513-BC02-4961-AE71-0DA704ED76F2.png`
- `C807E360-1BFC-4FD8-8E9B-153B4C2640B8.png`
- `85D74C38-14D0-4FB1-B5D3-716A1AD11188.png`

## Status

- If these files look identical, that is expected: the placeholders are currently copies of `brand-logo-primary.png`.
- The UI uses `brand-logo-primary.png` and other named brand files directly; the UUID filenames exist to match the spec.

```
