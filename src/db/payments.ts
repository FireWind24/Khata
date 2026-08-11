import { db } from './db'
import type { SyncOp } from './db'
import type { Payment, Category, PaymentMode } from '../types'
import { getDeviceId, uuid } from '../lib/id'
import { useLiveQuery } from 'dexie-react-hooks'

export interface PaymentInput {
  name: string
  amount: number
  date: string
  category: Category
  payment_mode: PaymentMode
}

function enqueue(kind: SyncOp['kind'], payment: Payment) {
  void db.sync_queue.add({
    kind,
    payment,
    local_id: payment.local_id,
    status: 'pending',
    attempts: 0,
    created_at: new Date().toISOString(),
  })
}

export async function addPayment(input: PaymentInput): Promise<Payment> {
  const now = new Date().toISOString()
  const payment: Payment = {
    local_id: uuid(),
    device_id: getDeviceId(),
    name: input.name.trim(),
    amount: input.amount,
    date: input.date,
    category: input.category,
    payment_mode: input.payment_mode,
    created_at: now,
    updated_at: now,
  }
  await db.payments.add(payment)
  enqueue('upsert', payment)
  return payment
}

export async function updatePayment(local_id: string, patch: Partial<PaymentInput>): Promise<Payment | undefined> {
  const existing = await db.payments.get(local_id)
  if (!existing) return undefined
  const updated: Payment = {
    ...existing,
    ...patch,
    name: (patch.name ?? existing.name).trim(),
    updated_at: new Date().toISOString(),
  }
  await db.payments.put(updated)
  enqueue('upsert', updated)
  return updated
}

export async function deletePayment(payment: Payment): Promise<void> {
  await db.payments.delete(payment.local_id)
  enqueue('delete', payment)
}

export function usePayments(): Payment[] | undefined {
  return useLiveQuery(() => db.payments.orderBy('date').reverse().toArray())
}

export async function allPayments(): Promise<Payment[]> {
  return db.payments.orderBy('date').toArray()
}

export function useDistinctNames(): string[] {
  return (
    useLiveQuery(async () => {
      const rows = await db.payments.orderBy('name').toArray()
      return [...new Set(rows.map((r) => r.name))].sort()
    }) ?? []
  )
}