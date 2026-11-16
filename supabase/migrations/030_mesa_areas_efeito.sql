-- PRG System v0.34.9 — áreas de efeito no mapa (círculo, cone, linha e quadrado).
-- Compatível com a versão anterior: só adiciona uma coluna com valor padrão.
alter table public.prg_cenas add column if not exists areas_efeito jsonb not null default '[]'::jsonb;
alter table public.prg_cenas drop constraint if exists prg_cenas_areas_efeito_check;
alter table public.prg_cenas add constraint prg_cenas_areas_efeito_check check (jsonb_typeof(areas_efeito) = 'array' and pg_column_size(areas_efeito) <= 20000);
