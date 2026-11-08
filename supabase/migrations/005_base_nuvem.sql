-- PRG System — Fase 1: base na nuvem (campanhas, convites, participantes e fichas)
--
-- Inclui o catálogo de aventureiros (prg_public_adventurers), caso ainda não exista.
-- Tabelas NOVAS e independentes: não altera as tabelas antigas (campaigns, profiles...).
-- Acesso somente pela API do servidor (service role). Nenhuma leitura/escrita pública.
-- Execute primeiro em um projeto de teste / branch do Supabase.

create extension if not exists pgcrypto;

-- Catálogo de aventureiros (idêntico a docs/sql/catalogo-aventureiros.sql; idempotente)
-- Tabela independente: não altera public.profiles nem as fichas.
create table if not exists public.prg_public_adventurers (
 id uuid primary key default gen_random_uuid(),
 apelido text not null check (char_length(apelido) between 3 and 40),
 avatar text check (avatar is null or char_length(avatar) <= 120000),
 created_at timestamptz not null default now()
);
create unique index if not exists prg_public_adventurers_apelido_unique
 on public.prg_public_adventurers (lower(apelido));
alter table public.prg_public_adventurers enable row level security;
revoke all on public.prg_public_adventurers from anon, authenticated;
-- Acesso exclusivamente pela API no servidor. Não liberar escrita pública.


-- Campanhas ------------------------------------------------------------------
create table if not exists public.prg_campanhas (
  id uuid primary key default gen_random_uuid(),
  mestre_id uuid not null references public.prg_public_adventurers(id) on delete restrict,
  nome text not null check (char_length(nome) between 3 and 80),
  descricao text not null default '' check (char_length(descricao) <= 600),
  sistema text not null check (char_length(sistema) between 2 and 80),
  modelo_padrao text not null default 'C' check (modelo_padrao in ('A','B','C')),
  permissoes jsonb not null default '{}'::jsonb,
  estado text not null default 'planejada' check (estado in ('planejada','ativa','pausada','encerrada')),
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);
create index if not exists prg_campanhas_mestre_idx on public.prg_campanhas (mestre_id);

-- Participantes (o mestre também é registrado como membro com papel 'mestre')
create table if not exists public.prg_campanha_membros (
  campanha_id uuid not null references public.prg_campanhas(id) on delete cascade,
  aventureiro_id uuid not null references public.prg_public_adventurers(id) on delete cascade,
  papel text not null default 'jogador' check (papel in ('mestre','comestre','jogador')),
  excecoes jsonb not null default '{}'::jsonb,
  entrou_em timestamptz not null default now(),
  primary key (campanha_id, aventureiro_id)
);
create index if not exists prg_membros_aventureiro_idx on public.prg_campanha_membros (aventureiro_id);

-- Convites por código/link ---------------------------------------------------
create table if not exists public.prg_convites (
  codigo text primary key check (codigo ~ '^[A-HJ-NP-Z2-9]{8}$'),
  campanha_id uuid not null references public.prg_campanhas(id) on delete cascade,
  criado_por uuid not null references public.prg_public_adventurers(id) on delete cascade,
  expira_em timestamptz not null,
  max_usos int not null default 20 check (max_usos between 1 and 100),
  usos int not null default 0 check (usos >= 0),
  revogado boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists prg_convites_campanha_idx on public.prg_convites (campanha_id);

-- Solicitações de participação (via convite) ---------------------------------
create table if not exists public.prg_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.prg_campanhas(id) on delete cascade,
  aventureiro_id uuid not null references public.prg_public_adventurers(id) on delete cascade,
  convite_codigo text references public.prg_convites(codigo) on delete set null,
  mensagem text not null default '' check (char_length(mensagem) <= 300),
  estado text not null default 'pendente' check (estado in ('pendente','aceita','recusada')),
  criada_em timestamptz not null default now(),
  decidida_em timestamptz
);
-- No máximo uma solicitação pendente por aventureiro e campanha
create unique index if not exists prg_solicitacoes_pendente_unique
  on public.prg_solicitacoes (campanha_id, aventureiro_id) where estado = 'pendente';

-- Fichas na nuvem ------------------------------------------------------------
-- campanha_id nulo = ficha independente. origem_id = ficha independente copiada.
create table if not exists public.prg_fichas (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references public.prg_public_adventurers(id) on delete cascade,
  campanha_id uuid references public.prg_campanhas(id) on delete cascade,
  origem_id uuid references public.prg_fichas(id) on delete set null,
  sistema text not null default 'lunethernnyis-v8',
  nome text not null default '' check (char_length(nome) <= 90),
  dados jsonb not null default '{}'::jsonb,
  versao int not null default 1,
  status text not null default 'ativa' check (status in ('ativa','pendente','recusada','arquivada')),
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  constraint prg_fichas_dados_tamanho check (pg_column_size(dados) <= 600000)
);
create index if not exists prg_fichas_dono_idx on public.prg_fichas (dono_id);
create index if not exists prg_fichas_campanha_idx on public.prg_fichas (campanha_id);

-- Atualização otimista: a API envia a versão lida; se outra aba salvou antes, nada é alterado.
create or replace function public.prg_salvar_ficha(p_id uuid, p_dono uuid, p_versao int, p_nome text, p_dados jsonb)
returns setof public.prg_fichas language sql security definer set search_path = public as $$
  update public.prg_fichas
     set dados = p_dados, nome = left(coalesce(p_nome, ''), 90), versao = versao + 1, atualizada_em = now()
   where id = p_id and dono_id = p_dono and versao = p_versao
  returning *;
$$;

-- Uso de convite atômico: aumenta usos só se ainda for válido.
create or replace function public.prg_usar_convite(p_codigo text)
returns setof public.prg_convites language sql security definer set search_path = public as $$
  update public.prg_convites
     set usos = usos + 1
   where codigo = p_codigo and not revogado and expira_em > now() and usos < max_usos
  returning *;
$$;

-- Segurança: RLS ligado, sem políticas = ninguém acessa pelo navegador.
alter table public.prg_campanhas enable row level security;
alter table public.prg_campanha_membros enable row level security;
alter table public.prg_convites enable row level security;
alter table public.prg_solicitacoes enable row level security;
alter table public.prg_fichas enable row level security;
revoke all on public.prg_campanhas, public.prg_campanha_membros, public.prg_convites,
  public.prg_solicitacoes, public.prg_fichas from anon, authenticated;
revoke all on function public.prg_salvar_ficha(uuid, uuid, int, text, jsonb) from public, anon, authenticated;
revoke all on function public.prg_usar_convite(text) from public, anon, authenticated;
grant execute on function public.prg_salvar_ficha(uuid, uuid, int, text, jsonb) to service_role;
grant execute on function public.prg_usar_convite(text) to service_role;
grant all on public.prg_public_adventurers, public.prg_campanhas, public.prg_campanha_membros,
  public.prg_convites, public.prg_solicitacoes, public.prg_fichas to service_role;
