import Dexie, { type Table } from 'dexie'
import type { Payment } from '../types'

export interface SyncOp {
  id?: number
  kind: 'upsert' | 'delete'
  payment?: Payment
  local_id: string
  status: 'pending' | 'error'
  attempts: number
  last_error?: string
  created_at: string
}

export interface BackupRecord {
  week: string
  csv: string
  created_at: string
}

class KhataDB extends Dexie {
  payments!: Table<Payment, string>
  sync_queue!: Table<SyncOp, number>
  backups!: Table<BackupRecord, string>

  constructor() {
    super('khata-db')
    this.version(1).stores({
      payments: 'local_id, date, name, category, payment_mode',
      sync_queue: '++id, local_id, status, created_at',
      backups: 'week',
    })
  }
}

export const db = new KhataDB()