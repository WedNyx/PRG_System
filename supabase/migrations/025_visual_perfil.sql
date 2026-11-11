-- v0.32.9: aparência personalizada de cada perfil (tema, foto de fundo, cores, fonte). Aditiva e idempotente.
alter table public.prg_public_adventurers add column if not exists visual jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'prg_public_adventurers_visual_tam') then
    alter table public.prg_public_adventurers add constraint prg_public_adventurers_visual_tam
      check (visual is null or (jsonb_typeof(visual) = 'object' and octet_length(visual::text) <= 2000));
  end if;
end $$;
