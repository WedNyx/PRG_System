-- v0.30.0: tabelas do mestre (geradores aleatórios) da campanha. Aditiva e idempotente.
alter table public.prg_campanhas add column if not exists tabelas jsonb not null default '[]'::jsonb;
