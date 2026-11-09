-- PRG System — v0.6.0: mapa em camadas, travas de tokens, sessões/diário, anotações e recompensas.
-- Aditiva. Acesso só pela API do servidor.

alter table public.prg_cenas
  add column if not exists camadas jsonb not null default '[]'::jsonb,
  add column if not exists tokens_travados boolean not null default false;
alter table public.prg_cenas drop constraint if exists prg_cenas_camadas_tamanho;
alter table public.prg_cenas add constraint prg_cenas_camadas_tamanho check (pg_column_size(camadas) <= 40000);

alter table public.prg_tokens
  add column if not exists movimento text not null default 'dono',
  add column if not exists tamanho int not null default 1;
alter table public.prg_tokens drop constraint if exists prg_tokens_movimento_check;
alter table public.prg_tokens add constraint prg_tokens_movimento_check check (movimento in ('dono','todos','mestre'));
alter table public.prg_tokens drop constraint if exists prg_tokens_tamanho_check;
alter table public.prg_tokens add constraint prg_tokens_tamanho_check check (tamanho between 1 and 4);

-- Sessões / diário da aventura
create table if not exists public.prg_sessoes (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.prg_campanhas(id) on delete cascade,
  numero int not null default 1 check (numero between 1 and 9999),
  titulo text not null check (char_length(titulo) between 1 and 120),
  data date,
  preparacao text not null default '' check (char_length(preparacao) <= 20000),  -- só mestre
  resumo text not null default '' check (char_length(resumo) <= 20000),          -- diário (visível se publicada)
  publicada boolean not null default false,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);
create index if not exists prg_sessoes_campanha_idx on public.prg_sessoes (campanha_id, numero desc);

-- Anotações: privada (só o autor), mestre (autor + mestres), campanha (todos), jogador (autor + um jogador)
create table if not exists public.prg_notas (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.prg_campanhas(id) on delete cascade,
  autor_id uuid references public.prg_public_adventurers(id) on delete set null,
  titulo text not null check (char_length(titulo) between 1 and 120),
  texto text not null default '' check (char_length(texto) <= 20000),
  visibilidade text not null default 'privada' check (visibilidade in ('privada','mestre','campanha','jogador')),
  destinatario_id uuid references public.prg_public_adventurers(id) on delete set null,
  fixada boolean not null default false,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);
create index if not exists prg_notas_campanha_idx on public.prg_notas (campanha_id, atualizada_em desc);

alter table public.prg_historico drop constraint if exists prg_historico_tipo_check;
alter table public.prg_historico add constraint prg_historico_tipo_check
  check (tipo in ('edicao','pedido','decisao','envio','aprovacao','bloqueio','npc','administracao','recompensa'));

alter table public.prg_sessoes enable row level security;
alter table public.prg_notas enable row level security;
revoke all on public.prg_sessoes, public.prg_notas from anon, authenticated;
grant all on public.prg_sessoes, public.prg_notas to service_role;
