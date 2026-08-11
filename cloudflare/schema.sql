create table if not exists payments (
	id text primary key default (lower(hex(randomblob(16)))),
	local_id text not null unique,
	device_id text not null,
	name text not null,
	amount real not null,
	date text not null,
	category text not null,
	payment_mode text not null,
	created_at text not null,
	updated_at text not null,
	rev integer not null default 0
);

create index if not exists idx_payments_rev on payments(rev);
create index if not exists idx_payments_local on payments(local_id);

create table if not exists tombstones (
	local_id text primary key,
	device_id text not null,
	deleted_at text not null,
	rev integer not null
);

create index if not exists idx_tombstones_rev on tombstones(rev);

create table if not exists _counter (
	id integer primary key,
	val integer not null default 0
);

insert into _counter (id, val) values (1, 0) on conflict(id) do nothing;