import { db } from './db'
import type { SyncOp } from './db'
import { createRemoteApi } from '../lib/backend'
import type { RemoteApi } from '../lib/backend'

const CURSOR_KEY = 'khata.sync.cursor'
const POLL_INTERVAL_MS = 30_000

let remote: RemoteApi | null = null
let isWatching = false
let flushInProgress = false
let syncInProgress = false

export function connectSync() {
  if (isWatching) return
  isWatching = true
  remote = createRemoteApi()
  if (!remote) return

  window.addEventListener('online', () => void runSync())
  window.addEventListener('offline', () => {
    /* entries stay queued locally; nothing is ever lost */
  })
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void runSync()
  })
  // Periodically retry stale queue and pull remote changes
  setInterval(() => {
    if (navigator.onLine) void runSync()
  }, POLL_INTERVAL_MS)
  void runSync()
}

export async function flushQueue(): Promise<void> {
  if (!remote) return
  if (flushInProgress) return
  if (!navigator.onLine) return
  flushInProgress = true
  try {
    const ops = await db.sync_queue.where('status').equals('pending').limit(50).toArray()
    for (const op of ops) {
      await pushOp(remote, op)
    }
  } finally {
    flushInProgress = false
  }
}

async function runSync(): Promise<void> {
  if (!remote) return
  if (syncInProgress) return
  if (!navigator.onLine) return
  syncInProgress = true
  try {
    await flushQueue()
    await pullChanges()
  } finally {
    syncInProgress = false
  }
}

async function pushOp(remote: RemoteApi, op: SyncOp): Promise<void> {
  if (!op.payment) return
  try {
    if (op.kind === 'upsert') {
      await remote.upsert({
        local_id: op.payment.local_id,
        device_id: op.payment.device_id,
        name: op.payment.name,
        amount: op.payment.amount,
        date: op.payment.date,
        category: op.payment.category,
        payment_mode: op.payment.payment_mode,
        created_at: op.payment.created_at,
        updated_at: op.payment.updated_at,
      })
    } else {
      await remote.remove(op.local_id)
    }
    await db.sync_queue.delete(op.id!)
  } catch (err) {
    await db.sync_queue.update(op.id!, {
      status: 'error',
      attempts: op.attempts + 1,
      last_error: err instanceof Error ? err.message : String(err),
    })
  }
}

async function pullChanges(): Promise<void> {
  if (!remote) return
  const since = Number(window.localStorage.getItem(CURSOR_KEY) ?? '0') || 0
  const { rows, tombstones, cursor } = await remote.pull(since)

  for (const row of rows) {
    const local = await db.payments.get(row.local_id)
    // Local copy beats the server copy (local is newer or not yet synced)
    if (!local) {
      await db.payments.add({
        id: row.id,
        local_id: row.local_id,
        device_id: row.device_id,
        name: row.name,
        amount: row.amount,
        date: row.date,
        category: row.category,
        payment_mode: row.payment_mode,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    }
  }
  for (const tombstone of tombstones) {
    // Only remove a remote-deleted row if it isn't itself pending a local change
    const pending = await db.sync_queue.where('local_id').equals(tombstone.local_id).toArray()
    if (pending.length === 0) {
      await db.payments.delete(tombstone.local_id)
    }
  }

  window.localStorage.setItem(CURSOR_KEY, String(cursor))
}

export function isSyncConfigured(): boolean {
  return isSyncConfiguredFlag
}

const isSyncConfiguredFlag = Boolean(import.meta.env.VITE_SYNC_URL && import.meta.env.VITE_SYNC_KEY)