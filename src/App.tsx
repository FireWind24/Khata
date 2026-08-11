import { useEffect, useState } from 'react'
import { Home } from './screens/Home'
import { History } from './screens/History'
import { Totals } from './screens/Totals'
import { PinLock } from './components/PinLock'
import { Sheet } from './components/Sheet'
import { BottomNav, type NavTarget } from './components/BottomNav'
import { EntryForm } from './components/EntryForm'
import { ConfirmSheet } from './components/ConfirmSheet'
import { addPayment, deletePayment, updatePayment } from './db/payments'
import { connectSync } from './db/sync'
import { runWeeklyBackup } from './db/backup'
import type { Payment } from './types'

type Route =
  | { name: 'home' }
  | { name: 'history' }
  | { name: 'totals' }
  | { name: 'entry'; local_id: string | null }

export function App() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('khata.unlocked') === '1')
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [loggedId, setLoggedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Boot: connectivity + realtime, weekly backup
  useEffect(() => {
    connectSync()
    void runWeeklyBackup()
  }, [])

  function openEntry(local_id: string | null = null) {
    setRoute({ name: 'entry', local_id })
  }

  function openPayment(p: Payment) {
    setEditPayment(p)
    openEntry(p.local_id)
  }

  async function handleSubmit(v: { name: string; amount: string; date: string; category: Payment['category']; payment_mode: Payment['payment_mode'] }) {
    if (route.name !== 'entry') return
    const amount = Number(v.amount)
    const local_id = route.local_id
    if (local_id) {
      await updatePayment(local_id, { name: v.name, amount, date: v.date, category: v.category, payment_mode: v.payment_mode })
    } else {
      const created = await addPayment({ name: v.name, amount, date: v.date, category: v.category, payment_mode: v.payment_mode })
      setLoggedId(created.local_id)
    }
    // Clear the imprint after it has played once
    setTimeout(() => setLoggedId(null), 2000)
    setEditPayment(null)
    setRoute({ name: 'home' })
  }

  async function handleDelete() {
    if (editPayment) {
      await deletePayment(editPayment)
    }
    setConfirmDelete(false)
    setEditPayment(null)
    setRoute({ name: 'home' })
  }

  if (!unlocked) {
    return (
      <PinLock
        onUnlock={() => {
          sessionStorage.setItem('khata.unlocked', '1')
          setUnlocked(true)
        }}
      />
    )
  }

  const routeContent = (() => {
    switch (route.name) {
      case 'history':
        return <History onOpenPayment={openPayment} />
      case 'totals':
        return <Totals />
      default:
        return (
          <Home
            onOpenEntry={() => {
              setEditPayment(null)
              openEntry(null)
            }}
            onOpenPayment={openPayment}
            loggedId={loggedId}
          />
        )
    }
  })()

  const navActive: NavTarget = route.name === 'entry' ? 'home' : (route.name as NavTarget)

  return (
    <main className="app">
      {routeContent}

      <BottomNav
        active={navActive}
        onChange={(target) => {
          setRoute({ name: target } as Route)
        }}
      />

      {route.name === 'entry' && (
        <Sheet title={editPayment ? 'Edit entry' : 'Log entry'} full onClose={() => setRoute({ name: 'home' })}>
          <EntryForm
            initial={editPayment ?? undefined}
            submitLabel={editPayment ? 'Save changes' : 'Log entry'}
            onSubmit={(v) => void handleSubmit(v)}
            onDelete={
              editPayment
                ? () => {
                    setConfirmDelete(true)
                  }
                : undefined
            }
          />
        </Sheet>
      )}

      {confirmDelete && editPayment && (
        <ConfirmSheet
          title="Delete entry?"
          message={`This will permanently remove "${editPayment.name}" from the ledger.`}
          confirmLabel="Yes, delete"
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </main>
  )
}