-- v0.33.6 (PR #42): modo de progressão da campanha (D&D 2024). Aditiva e idempotente.
-- D&D 2024: configuração de progressão por campanha.
-- Não reescreve fichas antigas nem altera os modos de outros sistemas.
alter table public.prg_campanhas
  add column if not exists config_progressao jsonb not null default '{"modo":"hibrido"}'::jsonb;

-- O back-end valida o objeto completo; o banco protege o valor principal.
alter table public.prg_campanhas
  drop constraint if exists prg_campanhas_config_progressao_modo_chk;
alter table public.prg_campanhas
  add constraint prg_campanhas_config_progressao_modo_chk
  check (
    jsonb_typeof(config_progressao) = 'object'
    and config_progressao->>'modo' in ('hibrido','automatico','manual')
  );
