-- v0.21.0: grupos de perfis no portal (Lunethernnyis / De Fora). Aditiva e idempotente.
-- Todos os perfis que já existem ficam em Lunethernnyis; cada pessoa pode trocar no “Editar perfil”.
alter table public.prg_public_adventurers add column if not exists grupo text not null default 'lunethernnyis';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'prg_public_adventurers_grupo_check') then
    alter table public.prg_public_adventurers add constraint prg_public_adventurers_grupo_check check (grupo in ('lunethernnyis', 'de-fora'));
  end if;
end $$;
