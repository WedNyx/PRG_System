-- PRG System — v0.36.3: Projeto N.O.V.A (do godgamer), a pedido dele: as vivências começam em d4.
-- 1) No sistema: liga o novo “grau inicial das perícias” (graus.inicialPericia = 4) e tira o grupo “1d4”
--    que ele tinha posto em cada vivência para tentar isso (virava um grupo só chamado “1d4”).
-- 2) Nas fichas do sistema: vivências em 0 passam a d4 (no N.O.V.A, 0 já rolava d4: muda só o que aparece).
-- Idempotente.
update public.prg_sistemas_autorais s
set definicao = jsonb_set(
      jsonb_set(s.definicao, '{graus,inicialPericia}', '4'::jsonb, true),
      '{pericias,lista}',
      coalesce((select jsonb_agg(case when e->>'grupo' = '1d4' then e - 'grupo' else e end order by ord)
                from jsonb_array_elements(s.definicao->'pericias'->'lista') with ordinality as t(e, ord)), '[]'::jsonb)),
    atualizado_em = now()
where s.id = '4e0a7c1d-2b6f-4c8e-9a3d-5f1e2d3c4b5a' and s.definicao ? 'pericias';

update public.prg_fichas f
set versao = f.versao + 1, atualizada_em = now(),
    dados = jsonb_set(f.dados, '{pericias}',
      (select coalesce(jsonb_object_agg(k, case when v = '0'::jsonb then '4'::jsonb else v end), '{}'::jsonb) from jsonb_each(f.dados->'pericias') t(k, v)))
where f.sistema = 'autoral-4e0a7c1d2b6f4c8e9a3d5f1e2d3c4b5a' and jsonb_typeof(f.dados->'pericias') = 'object'
  and exists (select 1 from jsonb_each(f.dados->'pericias') t(k, v) where v = '0'::jsonb);
