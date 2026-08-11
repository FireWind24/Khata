# Khata — Family Ledger

A private, single-family bookkeeping app. One user logs entries; you maintain the ledger.
Core promise: an entry is never lost, and logging one takes under ten seconds.

## Run

```sh
npm install
npm run dev
```

Build (PWA + service worker):

```sh
npm run build
npm run preview
```

Install on a phone: open the deployed URL (or `npm run preview` on your LAN) in Chrome, then
**Add to Home screen**. It opens full-screen, offline-first.

## Architecture

- **React + TypeScript + Vite**, PWA via `vite-plugin-pwa`
- **Dexie.js** (IndexedDB) is the source of truth for the UI — writes land instantly, offline
- **Cloudflare Workers + D1** pushes queued changes when online, keyed by `local_id`
  (idempotent, no duplicates); remote changes are pulled by polling
- Data model lives in `cloudflare/schema.sql` (apply with `wrangler d1 execute`)

### Offline / sync

1. On submit, the entry is written to IndexedDB immediately — zero network dependency.
2. A sync queue holds `upsert`/`delete` ops. The moment `navigator.onLine` flips, queued ops
   flush to the Cloudflare sync worker with `local_id` as the idempotency key, so a retried push
   never duplicates.
3. Icons, fonts, and assets are pre-cached by the service worker — full offline support.
4. A weekly background job snapshots the whole ledger to a CSV backup layer.

## Connecting the sync backend

The app runs fully offline with no backend configured. To enable cross-device sync:

```sh
cp .env.example .env
```

Fill in `VITE_SYNC_URL` (your worker URL) and `VITE_SYNC_KEY` (the shared secret), with the worker
itself deployed to Cloudflare:

```sh
cd cloudflare
wrangler d1 create khata-sync           # note the database_id
wrangler d1 execute khata-sync --local --file=schema.sql   # apply schema (use --remote for prod)
wrangler secret put SYNC_KEY            # same value as VITE_SYNC_KEY
wrangler deploy
```

Set `database_id` in `cloudflare/wrangler.toml` from the `wrangler d1 create` output, then rebuild
the app with your `.env` values. Existing local entries sync up on next launch.

## Security

The app is private by design: a 4-digit PIN gates the app on open. PIN is stored hashed in local
storage, not in plaintext.

## Scripts

- `npm run dev` — dev server
- `npm run build` — typecheck + production build (creates SW + manifest)
- `npm run lint` — oxlint
- `node scripts/gen-icons.mjs` — regenerate PWA icons (requires `sharp` devDependency)