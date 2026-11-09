-- PRG System — v0.9.0: biblioteca do mestre (itens e poderes prontos para dar como recompensa).
-- Aditiva. Acesso só pela API do servidor.
create table if not exists public.prg_biblioteca (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.prg_campanhas(id) on delete cascade,
  tipo text not null check (tipo in ('item','poder')),
  nome text not null check (char_length(nome) between 1 and 120),
  dados jsonb not null default '{}'::jsonb check (pg_column_size(dados) <= 20000),
  criado_por uuid references public.prg_public_adventurers(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists prg_biblioteca_campanha_idx on public.prg_biblioteca (campanha_id, tipo, nome);
alter table public.prg_biblioteca enable row level security;
revoke all on public.prg_biblioteca from anon, authenticated;
grant all on public.prg_biblioteca to service_role;
