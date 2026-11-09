-- PRG System — v0.11.0: notificações dentro da plataforma (sem e-mail). Aditiva e idempotente.
create table if not exists public.prg_notificacoes (
  id bigserial primary key,
  destinatario_id uuid not null references public.prg_public_adventurers(id) on delete cascade,
  campanha_id uuid references public.prg_campanhas(id) on delete cascade,
  tipo text not null check (char_length(tipo) between 1 and 40),
  titulo text not null check (char_length(titulo) between 1 and 160),
  texto text not null default '' check (char_length(texto) <= 400),
  link text check (link is null or (char_length(link) <= 300 and link like '/%')),
  lida boolean not null default false,
  criada_em timestamptz not null default now()
);
create index if not exists prg_notificacoes_dest_idx on public.prg_notificacoes (destinatario_id, lida, criada_em desc);
alter table public.prg_notificacoes enable row level security;
revoke all on public.prg_notificacoes from anon, authenticated;
grant all on public.prg_notificacoes to service_role;
grant usage, select on sequence public.prg_notificacoes_id_seq to service_role;
