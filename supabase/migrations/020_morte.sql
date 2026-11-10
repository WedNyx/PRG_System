-- v0.26.0: “à beira da morte” nos tokens: {"estado": "caido|estavel|morto", "sucessos": 0-3, "falhas": 0-3, "futuras": 0-3}.
-- A regra fica em prg_campanhas.combate.morte ('desligado' | 'testes' | 'desesperadas'). Aditiva e idempotente.
alter table public.prg_tokens add column if not exists morte jsonb not null default '{}'::jsonb;
