# Legra's Admin (Web)

Web Admin UI (React + Vite + TypeScript) for Legra's Construction & Development LLC.

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

Open `http://127.0.0.1:5173`.

## Fast Recovery (After Reboot / Return)

```bash
npm run dev:mobile
```

Stop both processes with:

```bash
npm run dev:mobile:stop
```

## Shared Employee Login (Supabase)

Set in `.env.local`:

- `VITE_USE_SUPABASE_EMPLOYEES=true`
- `VITE_USE_SUPABASE_WORKORDERS=true`
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`

Create Supabase tables/policies as documented in this repo's setup docs.
