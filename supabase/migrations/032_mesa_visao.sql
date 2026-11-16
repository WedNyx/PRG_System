-- PRG System v0.35.0 — visão dos personagens: a névoa se abre pelo que os tokens dos jogadores enxergam.
-- Compatível com a versão anterior: só adiciona colunas com valor padrão (desligado).
alter table public.prg_cenas add column if not exists visao_dinamica boolean not null default false;
alter table public.prg_cenas add column if not exists visao_alcance smallint not null default 0;
alter table public.prg_cenas drop constraint if exists prg_cenas_visao_alcance_check;
alter table public.prg_cenas add constraint prg_cenas_visao_alcance_check check (visao_alcance between 0 and 300);
