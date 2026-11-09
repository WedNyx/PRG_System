-- PRG System — v0.10.0: espectadores e sessão aberta/fechada pelo mestre. Aditiva e idempotente.
alter table public.prg_campanha_membros drop constraint if exists prg_campanha_membros_papel_check;
alter table public.prg_campanha_membros add constraint prg_campanha_membros_papel_check
  check (papel in ('mestre','comestre','jogador','espectador'));

-- Só o mestre abre a mesa; com a sessão fechada, ninguém além do mestre entra.
alter table public.prg_campanhas add column if not exists sessao_aberta boolean not null default false;
alter table public.prg_campanhas add column if not exists sessao_aberta_em timestamptz;
