-- v0.33.2: código de recuperação da senha do perfil (só o hash fica no banco). Aditiva e idempotente.
alter table public.prg_public_adventurers add column if not exists senha_recuperacao_hash text;
