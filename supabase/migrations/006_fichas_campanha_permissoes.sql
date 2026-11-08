-- PRG System — Fase 2: fichas em campanhas, aprovações, pedidos de alteração, histórico e NPCs.
-- Aditiva: só cria colunas/tabelas novas. Acesso apenas pela API do servidor.

alter table public.prg_fichas
  add column if not exists npc boolean not null default false,
  add column if not exists oculta boolean not null default false,
  add column if not exists bloqueada boolean not null default false,
  add column if not exists areas_bloqueadas text[] not null default '{}',
  add column if not exists observacao_mestre text not null default '' check (char_length(observacao_mestre) <= 600);

-- Uma ficha independente só pode ter uma cópia pendente por campanha.
create unique index if not exists prg_fichas_envio_pendente_unique
  on public.prg_fichas (origem_id, campanha_id) where status = 'pendente' and origem_id is not null;

-- Pedidos de alteração (áreas "com aprovação")
create table if not exists public.prg_alteracoes (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid not null references public.prg_fichas(id) on delete cascade,
  campanha_id uuid not null references public.prg_campanhas(id) on delete cascade,
  autor_id uuid not null references public.prg_public_adventurers(id) on delete cascade,
  mudancas jsonb not null,           -- [{caminho, categoria, antes, depois}]
  categorias text[] not null default '{}',
  estado text not null default 'pendente' check (estado in ('pendente','aceita','recusada','ajuste')),
  justificativa text not null default '' check (char_length(justificativa) <= 600),
  decidida_por uuid references public.prg_public_adventurers(id) on delete set null,
  criada_em timestamptz not null default now(),
  decidida_em timestamptz,
  constraint prg_alteracoes_tamanho check (pg_column_size(mudancas) <= 600000)
);
create index if not exists prg_alteracoes_campanha_idx on public.prg_alteracoes (campanha_id, estado);
-- No máximo um pedido pendente por autor e ficha (novos pedidos substituem o anterior).
create unique index if not exists prg_alteracoes_pendente_unique
  on public.prg_alteracoes (ficha_id, autor_id) where estado = 'pendente';

-- Histórico de alterações e decisões
create table if not exists public.prg_historico (
  id bigint generated always as identity primary key,
  ficha_id uuid references public.prg_fichas(id) on delete cascade,
  campanha_id uuid references public.prg_campanhas(id) on delete cascade,
  autor_id uuid references public.prg_public_adventurers(id) on delete set null,
  tipo text not null check (tipo in ('edicao','pedido','decisao','envio','aprovacao','bloqueio','npc','administracao')),
  categoria text,
  descricao text not null default '' check (char_length(descricao) <= 600),
  antes jsonb,
  depois jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists prg_historico_ficha_idx on public.prg_historico (ficha_id, criado_em desc);
create index if not exists prg_historico_campanha_idx on public.prg_historico (campanha_id, criado_em desc);

alter table public.prg_alteracoes enable row level security;
alter table public.prg_historico enable row level security;
revoke all on public.prg_alteracoes, public.prg_historico from anon, authenticated;
grant all on public.prg_alteracoes, public.prg_historico to service_role;
