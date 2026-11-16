-- PRG System v0.35.2 — visão de cada personagem: alcance próprio e visão no escuro (metros).
-- Compatível com a versão anterior: só adiciona uma coluna opcional.
alter table public.prg_tokens add column if not exists visao jsonb;
alter table public.prg_tokens drop constraint if exists prg_tokens_visao_check;
alter table public.prg_tokens add constraint prg_tokens_visao_check check (visao is null or (jsonb_typeof(visao) = 'object' and pg_column_size(visao) <= 300));
