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
