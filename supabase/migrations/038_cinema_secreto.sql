-- Cinema Secreto (v0.36.8, easter egg): salas para assistir vídeos do YouTube juntos, com fila, chat,
-- lista de quem está na sala e anfitrião que pode passar o controle. Tudo isolado em tabelas próprias.
-- Acesso só pela API no servidor (service_role), como o resto da plataforma. Idempotente.
create table if not exists public.prg_cinema_salas (
  codigo text primary key check (codigo ~ '^[A-F0-9]{16}$'),
  nome text not null check (char_length(nome) between 1 and 80),
  anfitriao_id uuid references public.prg_public_adventurers(id) on delete set null,
  estado jsonb not null check (jsonb_typeof(estado) = 'object'),
  revisao integer not null default 0 check (revisao >= 0),
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);
-- A primeira versão da PR #80 tinha anfitriao_hash (token); a sala agora é de um perfil.
alter table public.prg_cinema_salas add column if not exists anfitriao_id uuid references public.prg_public_adventurers(id) on delete set null;
alter table public.prg_cinema_salas add column if not exists atualizada_em timestamptz not null default now();
alter table public.prg_cinema_salas drop column if exists anfitriao_hash;
create index if not exists prg_cinema_salas_atualizada_idx on public.prg_cinema_salas (atualizada_em);

create table if not exists public.prg_cinema_presenca (
  codigo text not null references public.prg_cinema_salas(codigo) on delete cascade,
  aventureiro_id uuid not null references public.prg_public_adventurers(id) on delete cascade,
  entrou_em timestamptz not null default now(),
  visto_em timestamptz not null default now(),
  primary key (codigo, aventureiro_id)
);

create table if not exists public.prg_cinema_mensagens (
  id bigint generated always as identity primary key,
  codigo text not null references public.prg_cinema_salas(codigo) on delete cascade,
  autor_id uuid references public.prg_public_adventurers(id) on delete set null,
  texto text not null check (char_length(texto) between 1 and 500),
  sistema boolean not null default false,
  criada_em timestamptz not null default now()
);
create index if not exists prg_cinema_mensagens_sala_idx on public.prg_cinema_mensagens (codigo, id);

alter table public.prg_cinema_salas enable row level security;
alter table public.prg_cinema_presenca enable row level security;
alter table public.prg_cinema_mensagens enable row level security;
revoke all on public.prg_cinema_salas, public.prg_cinema_presenca, public.prg_cinema_mensagens from public, anon, authenticated;
grant select, insert, update, delete on public.prg_cinema_salas, public.prg_cinema_presenca, public.prg_cinema_mensagens to service_role;
