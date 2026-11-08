-- PRG System — Fase 3: mesa virtual ligada às campanhas novas (cenas, tokens, névoa, desenhos,
-- chat/rolagens com visibilidade e histórico permanente, iniciativa). Acesso só pela API.

create table if not exists public.prg_cenas (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.prg_campanhas(id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 80),
  mapa_url text check (mapa_url is null or char_length(mapa_url) <= 1000),
  grid_cols int not null default 20 check (grid_cols between 5 and 100),
  grid_rows int not null default 15 check (grid_rows between 5 and 100),
  fog_ativo boolean not null default false,
  fog_revelado text[] not null default '{}',
  ativa boolean not null default false,
  criada_em timestamptz not null default now()
);
create index if not exists prg_cenas_campanha_idx on public.prg_cenas (campanha_id);
create unique index if not exists prg_cenas_uma_ativa on public.prg_cenas (campanha_id) where ativa;

create table if not exists public.prg_tokens (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.prg_campanhas(id) on delete cascade,
  cena_id uuid not null references public.prg_cenas(id) on delete cascade,
  ficha_id uuid references public.prg_fichas(id) on delete set null,
  dono_id uuid references public.prg_public_adventurers(id) on delete set null,
  nome text not null check (char_length(nome) between 1 and 60),
  cor text not null default '#a78bfa' check (cor ~ '^#[0-9a-fA-F]{6}$'),
  imagem_url text check (imagem_url is null or char_length(imagem_url) <= 1000),
  x int not null default 0, y int not null default 0,
  visivel boolean not null default true,
  npc boolean not null default false,
  hp_atual int, hp_max int,
  condicoes text[] not null default '{}',
  criado_em timestamptz not null default now()
);
create index if not exists prg_tokens_cena_idx on public.prg_tokens (cena_id);

create table if not exists public.prg_desenhos (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.prg_campanhas(id) on delete cascade,
  cena_id uuid not null references public.prg_cenas(id) on delete cascade,
  autor_id uuid references public.prg_public_adventurers(id) on delete set null,
  cor text not null check (cor ~ '^#[0-9a-fA-F]{6}$'),
  pontos jsonb not null,
  criado_em timestamptz not null default now(),
  constraint prg_desenhos_tamanho check (pg_column_size(pontos) <= 60000)
);
create index if not exists prg_desenhos_cena_idx on public.prg_desenhos (cena_id);

-- Chat e rolagens (histórico permanente). visibilidade: publica | mestre (autor + mestres) | privada (autor + destinatário)
create table if not exists public.prg_mesa_eventos (
  id bigint generated always as identity primary key,
  campanha_id uuid not null references public.prg_campanhas(id) on delete cascade,
  autor_id uuid references public.prg_public_adventurers(id) on delete set null,
  tipo text not null check (tipo in ('chat','rolagem','sistema')),
  visibilidade text not null default 'publica' check (visibilidade in ('publica','mestre','privada')),
  destinatario_id uuid references public.prg_public_adventurers(id) on delete set null,
  personagem text check (personagem is null or char_length(personagem) <= 90),
  texto text check (texto is null or char_length(texto) <= 1000),
  expressao text check (expressao is null or char_length(expressao) <= 80),
  resultados int[],
  total int,
  criado_em timestamptz not null default now()
);
create index if not exists prg_mesa_eventos_campanha_idx on public.prg_mesa_eventos (campanha_id, id desc);

-- Iniciativa e turno da mesa
alter table public.prg_campanhas add column if not exists mesa jsonb not null default '{"iniciativa":[],"turno":0,"rodada":1}'::jsonb;

alter table public.prg_cenas enable row level security;
alter table public.prg_tokens enable row level security;
alter table public.prg_desenhos enable row level security;
alter table public.prg_mesa_eventos enable row level security;
revoke all on public.prg_cenas, public.prg_tokens, public.prg_desenhos, public.prg_mesa_eventos from anon, authenticated;
grant all on public.prg_cenas, public.prg_tokens, public.prg_desenhos, public.prg_mesa_eventos to service_role;
