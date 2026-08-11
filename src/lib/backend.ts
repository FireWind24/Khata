import type { Payment } from '../types'

const url = import.meta.env.VITE_SYNC_URL as string | undefined
const key = import.meta.env.VITE_SYNC_KEY as string | undefined
export const isSyncConfigured = Boolean(url && key)

export interface RemoteRow {
  id: string
  local_id: string
  device_id: string
  name: string
  amount: number
  date: string
  category: Payment['category']
  payment_mode: Payment['payment_mode']
  created_at: string
  updated_at: string
  rev: number
}

export interface Tombstone {
  local_id: string
  deleted_at: string
  rev: number
}

export interface RemoteApi {
  upsert(payment: Omit<RemoteRow, 'id' | 'rev'>): Promise<void>
  remove(local_id: string): Promise<void>
  pull(since: number): Promise<{ rows: RemoteRow[]; tombstones: Tombstone[]; cursor: number }>
}

function buildHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-sync-key': key!,
  }
}

async function check(res: Response): Promise<void> {
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) detail = body.error
    } catch {
      /* keep statusText */
    }
    throw new Error(`sync server ${res.status}: ${detail}`)
  }
}

export function createRemoteApi(): RemoteApi | null {
  if (!url || !key) return null
  const base = url.replace(/\/+$/, '')
  return {
    async upsert(payment) {
      const res = await fetch(`${base}/api/upsert`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ rows: [payment] }),
      })
      await check(res)
    },
    async remove(local_id) {
      const res = await fetch(`${base}/api/delete`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ local_id }),
      })
      await check(res)
    },
    async pull(since) {
      const res = await fetch(`${base}/api/pull?since=${encodeURIComponent(since)}`, {
        headers: buildHeaders(),
      })
      await check(res)
      const body = (await res.json()) as {
        rows: RemoteRow[]
        tombstones: Tombstone[]
        cursor: number
      }
      return body
    },
  }
}