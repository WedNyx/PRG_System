-- v0.24.0: dano por turno das condições (ex.: {"queimando": "1d6", "envenenado": "1d4"}). Aditiva e idempotente.
-- O dano é rolado no começo do turno do token e sai da vida dele (ou da ficha ligada).
alter table public.prg_tokens add column if not exists condicoes_dano jsonb not null default '{}'::jsonb;
