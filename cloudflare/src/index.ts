interface DB {
	prepare(sql: string): {
		bind(...params: unknown[]): unknown
		batch(values: unknown[]): Promise<unknown[]>
		first(): Promise<Record<string, unknown> | null>
		first<T>(): Promise<T | null>
		all<T = Record<string, unknown>>(): Promise<{ results: T[] }>
	}
}

export interface Env {
	DB: DB
	SYNC_KEY: string
}

interface CloudRow {
	id: string
	local_id: string
	device_id: string
	name: string
	amount: number
	date: string
	category: string
	payment_mode: string
	created_at: string
	updated_at: string
	rev: number
}

const JSON_HEADERS: Record<string, string> = {
	"Content-Type": "application/json",
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, x-sync-key",
	"Access-Control-Max-Age": "86400",
}

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

function unauthorized(): Response {
	return json({ error: "unauthorized" }, 401)
}

function authorized(request: Request, env: Env): boolean {
	return request.headers.get("x-sync-key") === env.SYNC_KEY
}

async function nextRev(db: DB): Promise<number> {
	const row = await db
		.prepare("update _counter set val = val + 1 where id = 1 returning val")
		.first<{ val: number }>()
	return row?.val ?? 0
}

async function handleUpsert(request: Request, db: DB): Promise<Response> {
	const { rows } = (await request.json()) as { rows: CloudRow[] }
	if (!Array.isArray(rows) || rows.length === 0) {
		return json({ error: "rows required" }, 400)
	}

	const now = new Date().toISOString()
	const statements: unknown[] = []
	const resultIds: { local_id: string; id: string }[] = []

	for (const row of rows) {
		const rev = await nextRev(db)
		const stmt = db
			.prepare(
				`insert into payments
					(local_id, device_id, name, amount, date, category, payment_mode, created_at, updated_at, rev)
				 values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				 on conflict(local_id) do update set
				 	device_id = excluded.device_id,
				 	name = excluded.name,
				 	amount = excluded.amount,
				 	date = excluded.date,
				 	category = excluded.category,
				 	payment_mode = excluded.payment_mode,
				 	created_at = payments.created_at,
				 	updated_at = excluded.updated_at,
				 	rev = excluded.rev
				 returning id, local_id`
			)
			.bind(
				row.local_id,
				row.device_id,
				row.name,
				row.amount,
				row.date,
				row.category,
				row.payment_mode,
				row.created_at,
				now,
				rev
			)
		statements.push(stmt)
	}

	const results = (await db.batch(statements)) as { results: { id: string; local_id: string }[] }[]
	for (const res of results) {
		const first = res.results[0]
		if (first) resultIds.push(first)
	}

	return json({ rows: resultIds })
}

async function handleDelete(request: Request, db: DB): Promise<Response> {
	const body = (await request.json()) as { local_id?: string; device_id?: string }
	if (!body.local_id) return json({ error: "local_id required" }, 400)

	const rev = await nextRev(db)
	const now = new Date().toISOString()
	await db.batch([
		db.prepare("delete from payments where local_id = ?").bind(body.local_id),
		db
			.prepare(
				`insert into tombstones (local_id, device_id, deleted_at, rev)
				 values (?, ?, ?, ?)
				 on conflict(local_id) do update set
				 	device_id = excluded.device_id,
				 	deleted_at = excluded.deleted_at,
				 	rev = excluded.rev`
			)
			.bind(body.local_id, body.device_id ?? "", now, rev),
	])

	return json({ ok: true })
}

async function handlePull(request: Request, db: DB): Promise<Response> {
	const url = new URL(request.url)
	const since = Number(url.searchParams.get("since") ?? "0")
	if (!Number.isFinite(since)) return json({ error: "invalid since" }, 400)

	const payments = await db
		.prepare(
			`select id, local_id, device_id, name, amount, date, category, payment_mode, created_at, updated_at, rev
			 from payments where rev > ? order by rev asc`
		)
		.bind(since)
		.all<CloudRow>()

	const tombstones = await db
		.prepare("select local_id, deleted_at, rev from tombstones where rev > ? order by rev asc")
		.bind(since)
		.all<{ local_id: string; deleted_at: string; rev: number }>()

	let cursor = since
	for (const p of payments.results) if (p.rev > cursor) cursor = p.rev
	for (const t of tombstones.results) if (t.rev > cursor) cursor = t.rev

	return json({ rows: payments.results, tombstones: tombstones.results, cursor })
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS })
		if (!authorized(request, env)) return unauthorized()

		const url = new URL(request.url)
		const route = url.pathname.replace(/\/+$/, "")

		try {
			switch (route) {
				case "/api/upsert":
					return await handleUpsert(request, env.DB)
				case "/api/delete":
					return await handleDelete(request, env.DB)
				case "/api/pull":
					return await handlePull(request, env.DB)
				case "/health":
					return json({ ok: true })
				default:
					return json({ error: "not found" }, 404)
			}
		} catch (err) {
			return json({ error: err instanceof Error ? err.message : "server error" }, 500)
		}
	},
}