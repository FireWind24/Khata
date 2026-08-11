export const CATEGORIES = ['business', 'fees', 'general', 'medicine', 'other'] as const
export type Category = (typeof CATEGORIES)[number]

export const PAYMENT_MODES = ['cash', 'bank_transfer', 'cheque', 'online_transfer'] as const
export type PaymentMode = (typeof PAYMENT_MODES)[number]

export const CATEGORY_LABELS: Record<Category, string> = {
  business: 'Business',
  fees: 'Fees',
  general: 'General',
  medicine: 'Medicine',
  other: 'Other',
}

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  cheque: 'Cheque',
  online_transfer: 'Online transfer',
}

export interface Payment {
  id?: string // server uuid, set after first sync
  local_id: string // on-device idempotency key, set before any network
  device_id: string
  name: string
  amount: number
  date: string // YYYY-MM-DD, always, never free text
  category: Category
  payment_mode: PaymentMode
  created_at: string // ISO
  updated_at: string // ISO
}