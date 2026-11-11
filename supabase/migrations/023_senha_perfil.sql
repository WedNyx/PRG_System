-- v0.31.0: senha opcional por perfil (sem e-mail). Aditiva e idempotente.
-- A senha fica só como hash (scrypt) e nunca sai do servidor; o catálogo continua fechado para anon/authenticated.
alter table public.prg_public_adventurers add column if not exists senha_hash text;
alter table public.prg_public_adventurers add column if not exists senha_falhas int not null default 0;
alter table public.prg_public_adventurers add column if not exists senha_bloqueio_ate timestamptz;

-- Aparelhos lembrados (30 dias). Guardamos só o hash do token; o token fica num cookie HttpOnly.
create table if not exists public.prg_perfil_sessoes (
  id uuid primary key default gen_random_uuid(),
  aventureiro_id uuid not null references public.prg_public_adventurers(id) on delete cascade,
  token_hash text not null unique,
  aparelho text not null default '',
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null
);
create index if not exists prg_perfil_sessoes_aventureiro on public.prg_perfil_sessoes (aventureiro_id);
alter table public.prg_perfil_sessoes enable row level security;
revoke all on public.prg_perfil_sessoes from anon, authenticated;
