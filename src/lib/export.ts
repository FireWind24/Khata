import type { Payment } from '../types'
import { buildCsv } from '../db/backup'
import { categoryLabel, paymentModeLabel, formatMoney, formatDate } from './format'
import { amountToWords } from './words'

export function downloadCsv(payments: Payment[], filename: string) {
  const rows = payments.map((p) => ({
    name: p.name,
    amount: p.amount,
    date: p.date,
    category: p.category,
    payment_mode: p.payment_mode,
  }))
  const csv = buildCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export function printPdf(payments: Payment[], title: string) {
  const w = window.open('', '_blank', 'width=800,height=1000')
  if (!w) return

  const total = payments.reduce((s, p) => s + p.amount, 0)
  const rowsHtml = payments
    .map(
      (p) => `
      <tr>
        <td>${p.name}</td>
        <td>${categoryLabel(p.category)}</td>
        <td>${formatDate(p.date)}</td>
        <td class="pm">${paymentModeLabel(p.payment_mode)}</td>
        <td class="mono">${formatMoney(p.amount)}<div class="words">${amountToWords(p.amount)}</div></td>
      </tr>`,
    )
    .join('')

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:Georgia,'Times New Roman',serif;color:#2b2a22;background:#fff;margin:40px}
    h1{font-size:20px;font-weight:700;margin:0 0 4px}
    .title{font-size:12px;color:#726b54;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#726b54;border-bottom:2px solid #2b2a22;padding:6px 8px}
    td{border-bottom:1px solid #c7bfa0;padding:8px;font-size:13px}
    td.mono{font-family:'Courier New',monospace;text-align:right;white-space:nowrap}
    td.pm{color:#726b54}
    .words{font-family:Georgia,serif;font-size:10px;color:#726b54;text-align:right;margin-top:2px;white-space:normal;max-width:180px}
    .total{margin-top:16px;text-align:right;font-size:18px;font-weight:700}
    .total .mono{font-family:'Courier New',monospace}
  </style></head><body>
    <h1>${title}</h1>
    <div class="title">Generated ${new Date().toLocaleDateString('en-PK')}</div>
    <table>
      <thead><tr><th>Name</th><th>Category</th><th>Date</th><th>Payment</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="total">Total <span class="mono">${formatMoney(total)}</span></div>
    <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
  </body></html>`)
  w.document.close()
}