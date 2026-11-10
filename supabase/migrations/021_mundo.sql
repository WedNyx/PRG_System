-- v0.28.0: Mundo da campanha (mapa-múndi com alfinetes, páginas de lugares/NPCs/facções e teia de relações).
-- Fica num jsonb da campanha; o servidor limpa e esconde as páginas “só o mestre” dos jogadores. Aditiva e idempotente.
alter table public.prg_campanhas add column if not exists mundo jsonb not null default '{}'::jsonb;
