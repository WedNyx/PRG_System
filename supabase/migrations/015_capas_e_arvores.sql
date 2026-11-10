-- PRG System — v0.14.0: capa das campanhas (imagem no cartão). Aditiva e idempotente.
alter table public.prg_campanhas add column if not exists capa_url text
  check (capa_url is null or (char_length(capa_url) <= 500 and capa_url ~ '^https?://'));
