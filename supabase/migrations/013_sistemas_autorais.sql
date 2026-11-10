-- PRG System — v0.12.0: sistemas autorais criados pelos jogadores. Aditiva e idempotente.
create table if not exists public.prg_sistemas_autorais (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references public.prg_public_adventurers(id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 80),
  resumo text not null default '' check (char_length(resumo) <= 400),
  definicao jsonb not null check (pg_column_size(definicao) <= 120000),
  publicado boolean not null default false,
  versao int not null default 1,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists prg_sistemas_autorais_dono_idx on public.prg_sistemas_autorais (dono_id);
create index if not exists prg_sistemas_autorais_pub_idx on public.prg_sistemas_autorais (publicado, nome);
alter table public.prg_sistemas_autorais enable row level security;
revoke all on public.prg_sistemas_autorais from anon, authenticated;
grant all on public.prg_sistemas_autorais to service_role;
