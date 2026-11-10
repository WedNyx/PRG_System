-- PRG System — v0.13.0: limpeza do login antigo por e-mail + registro de erros + cópias de segurança.
-- Idempotente. As tabelas antigas (campanhas, personagens, rolagens, mensagens, notas, campanha_players)
-- estavam vazias; profiles tinha só o perfil do login antigo. Nada da plataforma atual (prg_*) é tocado.

-- 1) Gatilhos e funções do sistema antigo
do $$ begin
  if to_regclass('auth.users') is not null then
    execute 'drop trigger if exists on_auth_user_created on auth.users';
  end if;
end $$;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.entrar_com_codigo(text) cascade;
drop function if exists public.sou_membro_da_campanha(uuid) cascade;
drop function if exists public.update_updated_at() cascade;

-- 2) Tabelas antigas (com as regras de acesso delas)
drop table if exists public.rolagens cascade;
drop table if exists public.mensagens cascade;
drop table if exists public.notas cascade;
drop table if exists public.personagens cascade;
drop table if exists public.campanha_players cascade;
drop table if exists public.campanhas cascade;
drop table if exists public.profiles cascade;

-- 3) Registro de erros inesperados (servidor e navegador), visto só pelo administrador
create table if not exists public.prg_erros (
  id bigserial primary key,
  origem text not null check (origem in ('servidor', 'navegador')),
  local text not null default '' check (char_length(local) <= 200),
  mensagem text not null check (char_length(mensagem) between 1 and 500),
  detalhe text not null default '' check (char_length(detalhe) <= 2000),
  criado_em timestamptz not null default now()
);
create index if not exists prg_erros_criado_idx on public.prg_erros (criado_em desc);
alter table public.prg_erros enable row level security;
revoke all on public.prg_erros from anon, authenticated;
grant all on public.prg_erros to service_role;
grant usage, select on sequence public.prg_erros_id_seq to service_role;
