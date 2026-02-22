import dayjs from 'dayjs'
import type { Client, Invoice, InvoiceItem, PaymentSchedule } from '../../api/client'
import { money } from '../ui/MoneyInput'
import { DocumentBrandMark } from '../ui/DocumentBrandMark'

function fmtMaybeDate(s: string) {
  const d = dayjs(s)
  return d.isValid() ? d.format('MMM D, YYYY') : s
}

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
  const printableItems = items.filter(
    (it) =>
      !it.description.trim().startsWith('[Material]') &&
      !it.description.trim().startsWith('[Labor]') &&
      !it.description.trim().startsWith('[PKGCOMP-'),
  )
  const orderTotal = printableItems.reduce((sum, it) => sum + it.qty * it.unitPrice, 0)
  const subtotal = orderTotal - (invoice.discount ?? 0)

  return (
    <div className="docWrap">
      <div className="docPage">
        <DocumentBrandMark />
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
                  <th>Possible starting date</th>
                  <th>Possible culmination date</th>
                  <th>Delivery date</th>
                  <th>Payment terms</th>
                  <th>Due date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{invoice.salesperson}</td>
                  <td>{invoice.job}</td>
                  <td>{fmtMaybeDate(invoice.shippingMethod)}</td>
                  <td>{fmtMaybeDate(invoice.shippingTerms)}</td>
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
                {printableItems.map((it) => (
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
