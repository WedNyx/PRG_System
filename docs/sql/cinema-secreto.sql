-- Aplicar no banco do PRG System antes de ativar o cinema.
create table if not exists public.prg_cinema_salas (
  codigo text primary key check (codigo ~ '^[A-F0-9]{16}$'),
  nome text not null check (char_length(nome) between 1 and 80),
  anfitriao_hash text not null check (char_length(anfitriao_hash) = 64),
  estado jsonb not null check (jsonb_typeof(estado) = 'object'),
  revisao integer not null default 0 check (revisao >= 0),
  criada_em timestamptz not null default now()
);
alter table public.prg_cinema_salas enable row level security;
revoke all on public.prg_cinema_salas from public, anon, authenticated;
grant select, insert, update, delete on public.prg_cinema_salas to service_role;
