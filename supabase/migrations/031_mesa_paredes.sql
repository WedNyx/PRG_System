-- PRG System v0.34.10 — paredes, portas e janelas do mapa (bloqueiam a passagem dos tokens).
-- Compatível com a versão anterior: só adiciona uma coluna com valor padrão.
alter table public.prg_cenas add column if not exists paredes jsonb not null default '[]'::jsonb;
alter table public.prg_cenas drop constraint if exists prg_cenas_paredes_check;
alter table public.prg_cenas add constraint prg_cenas_paredes_check check (jsonb_typeof(paredes) = 'array' and pg_column_size(paredes) <= 60000);
