-- PRG System v0.33.8 — mapa maior, partes do mapa com névoa e luz própria dos tokens.
-- Tudo compatível com a versão anterior: só aumenta limites e adiciona colunas com valor padrão.

-- Mapa de até 200 × 200 células (antes 100 × 100).
alter table public.prg_cenas drop constraint if exists prg_cenas_grid_cols_check;
alter table public.prg_cenas drop constraint if exists prg_cenas_grid_rows_check;
alter table public.prg_cenas add constraint prg_cenas_grid_cols_check check (grid_cols between 5 and 200);
alter table public.prg_cenas add constraint prg_cenas_grid_rows_check check (grid_rows between 5 and 200);

-- Partes do mapa com névoa (retângulos; sem nenhuma, a névoa cobre o mapa todo, como antes).
alter table public.prg_cenas add column if not exists fog_areas jsonb not null default '[]'::jsonb;
alter table public.prg_cenas drop constraint if exists prg_cenas_fog_areas_check;
alter table public.prg_cenas add constraint prg_cenas_fog_areas_check check (jsonb_typeof(fog_areas) = 'array' and pg_column_size(fog_areas) <= 30000);
-- Escuridão da cena (0 = dia claro, 100 = breu) e se a luz dos personagens tira a névoa por onde passa.
alter table public.prg_cenas add column if not exists escuridao smallint not null default 0;
alter table public.prg_cenas drop constraint if exists prg_cenas_escuridao_check;
alter table public.prg_cenas add constraint prg_cenas_escuridao_check check (escuridao between 0 and 100);
alter table public.prg_cenas add column if not exists luz_revela_nevoa boolean not null default true;

-- Luz própria do token: {brilho, penumbra (metros), cor}.
alter table public.prg_tokens add column if not exists luz jsonb;
alter table public.prg_tokens drop constraint if exists prg_tokens_luz_check;
alter table public.prg_tokens add constraint prg_tokens_luz_check check (luz is null or (jsonb_typeof(luz) = 'object' and pg_column_size(luz) <= 500));
