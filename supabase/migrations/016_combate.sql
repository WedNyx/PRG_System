-- PRG System — v0.18.0: combate na mesa. Aditiva e idempotente.
-- Regras de combate da campanha (o mestre escolhe antes de jogar): acerto 'automatico' (dano já sai) ou 'mestre' (mestre confirma).
alter table public.prg_campanhas add column if not exists combate jsonb not null default '{"acerto":"mestre"}'::jsonb;
-- Eventos de ataque no chat da mesa, com os detalhes (alvo, dano, situação do dano).
alter table public.prg_mesa_eventos add column if not exists dados jsonb;
alter table public.prg_mesa_eventos drop constraint if exists prg_mesa_eventos_tipo_check;
alter table public.prg_mesa_eventos add constraint prg_mesa_eventos_tipo_check check (tipo in ('chat','rolagem','sistema','ataque'));
alter table public.prg_mesa_eventos drop constraint if exists prg_mesa_eventos_dados_tamanho;
alter table public.prg_mesa_eventos add constraint prg_mesa_eventos_dados_tamanho check (dados is null or pg_column_size(dados) <= 8000);
