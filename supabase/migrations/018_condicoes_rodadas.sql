-- v0.23.0: duração das condições dos tokens, em rodadas (ex.: {"envenenado": 3}). Aditiva e idempotente.
-- Condição sem número = sem limite (o mestre tira na mão). A contagem desce no fim do turno do token.
alter table public.prg_tokens add column if not exists condicoes_rodadas jsonb not null default '{}'::jsonb;
