-- Execute somente após configurar limitação de taxa persistente / antiabuso na API.
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
