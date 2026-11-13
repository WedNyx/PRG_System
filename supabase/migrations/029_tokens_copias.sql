-- PRG System v0.33.8 — tokens que são cópias de uma ficha (ex.: 5 goblins da mesma ficha de NPC).
-- A cópia usa a ficha-modelo para imagem, ataques, poderes, testes e iniciativa, mas tem vida própria no token.
alter table public.prg_tokens add column if not exists ficha_modelo uuid references public.prg_fichas(id) on delete set null;
create index if not exists prg_tokens_ficha_modelo_idx on public.prg_tokens (ficha_modelo);
