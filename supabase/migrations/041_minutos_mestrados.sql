-- PRG System v0.37.2 — minutos mestrados na mesa (libera a moldura “Coroa do Mestre” com 15 minutos ou mais).
-- Idempotente. Acesso só pela API do servidor.

alter table public.prg_public_adventurers add column if not exists minutos_mestrados int not null default 0
  check (minutos_mestrados >= 0);

-- Soma de forma atômica (cada sessão encerrada vale no máximo 12 horas, para um esquecimento não contar dias).
create or replace function public.prg_somar_minutos_mestrados(p_id uuid, p_min int) returns void
language sql security definer set search_path = public as $$
  update public.prg_public_adventurers
     set minutos_mestrados = minutos_mestrados + greatest(0, least(p_min, 720))
   where id = p_id;
$$;
revoke all on function public.prg_somar_minutos_mestrados(uuid, int) from public, anon, authenticated;
grant execute on function public.prg_somar_minutos_mestrados(uuid, int) to service_role;

-- Sessões antigas: cada “abriu a sessão” seguido de “encerrou a sessão” na mesma campanha conta para o mestre dela.
-- Só roda se ninguém tem minutos ainda (rodar de novo não soma duas vezes).
do $$ begin
  if not exists (select 1 from public.prg_public_adventurers where minutos_mestrados > 0) then
    with ev as (
      select e.campanha_id, e.criado_em, e.texto like '🟢%' as abre
        from public.prg_mesa_eventos e
       where e.tipo = 'sistema' and (e.texto like '🟢 O mestre abriu%' or e.texto like '🔴 O mestre encerrou%')
    ), pares as (
      select campanha_id, criado_em, abre,
             lead(criado_em) over (partition by campanha_id order by criado_em) as prox,
             lead(abre) over (partition by campanha_id order by criado_em) as prox_abre
        from ev
    ), soma as (
      select c.mestre_id, sum(least(720, floor(extract(epoch from (p.prox - p.criado_em)) / 60)))::int as minutos
        from pares p join public.prg_campanhas c on c.id = p.campanha_id
       where p.abre and p.prox_abre = false
       group by c.mestre_id
    )
    update public.prg_public_adventurers a set minutos_mestrados = s.minutos from soma s where a.id = s.mestre_id and s.minutos > 0;
  end if;
end $$;
