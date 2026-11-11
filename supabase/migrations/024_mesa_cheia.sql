-- v0.32.2: mesa cheia. Aditiva e idempotente.
-- 1) Dano em token sem ficha numa operação só (vários ataques ao mesmo tempo não se perdem).
create or replace function public.prg_token_dano(p_token uuid, p_dano int)
returns table(antes int, depois int, maximo int)
language plpgsql security definer set search_path = public as $$
declare a int; m int; d int;
begin
  select coalesce(t.hp_atual, t.hp_max, 0), t.hp_max into a, m from prg_tokens t where t.id = p_token for update;
  if not found then return; end if;
  d := greatest(0, a - p_dano);
  if m is not null then d := least(d, greatest(m, a)); end if;
  update prg_tokens set hp_atual = d where id = p_token;
  return query select a, d, m;
end $$;
revoke all on function public.prg_token_dano(uuid, int) from public, anon, authenticated;

-- 2) Índices nas chaves estrangeiras apontadas pelo verificador do Supabase (apagar campanha/perfil fica rápido).
create index if not exists prg_alteracoes_autor_idx on public.prg_alteracoes (autor_id);
create index if not exists prg_alteracoes_decidida_idx on public.prg_alteracoes (decidida_por);
create index if not exists prg_biblioteca_criado_idx on public.prg_biblioteca (criado_por);
create index if not exists prg_convites_criado_idx on public.prg_convites (criado_por);
create index if not exists prg_desenhos_autor_idx on public.prg_desenhos (autor_id);
create index if not exists prg_desenhos_campanha_idx on public.prg_desenhos (campanha_id);
create index if not exists prg_historico_autor_idx on public.prg_historico (autor_id);
create index if not exists prg_mesa_eventos_autor_idx on public.prg_mesa_eventos (autor_id);
create index if not exists prg_mesa_eventos_dest_idx on public.prg_mesa_eventos (destinatario_id);
create index if not exists prg_notas_autor_idx on public.prg_notas (autor_id);
create index if not exists prg_notas_dest_idx on public.prg_notas (destinatario_id);
create index if not exists prg_notificacoes_campanha_idx on public.prg_notificacoes (campanha_id);
create index if not exists prg_playlists_dono_idx on public.prg_playlists (dono_id);
create index if not exists prg_solicitacoes_aventureiro_idx on public.prg_solicitacoes (aventureiro_id);
create index if not exists prg_solicitacoes_convite_idx on public.prg_solicitacoes (convite_codigo);
create index if not exists prg_tokens_campanha_idx on public.prg_tokens (campanha_id);
create index if not exists prg_tokens_dono_idx on public.prg_tokens (dono_id);
create index if not exists prg_tokens_ficha_idx on public.prg_tokens (ficha_id);

-- 3) Casa livre para um token novo, uma cena de cada vez (vários “Colocar na mesa” juntos não empilham).
create or replace function public.prg_token_casa_livre(p_token uuid)
returns table(x int, y int)
language plpgsql security definer set search_path = public as $$
declare c_id uuid; cols int; rows_ int; cx int; cy int; r int; dx int; dy int; nx int; ny int;
begin
  select t.cena_id into c_id from prg_tokens t where t.id = p_token;
  if c_id is null then return; end if;
  perform pg_advisory_xact_lock(hashtext('prg_cena:' || c_id::text));
  select c.grid_cols, c.grid_rows into cols, rows_ from prg_cenas c where c.id = c_id;
  cx := cols / 2; cy := rows_ / 2;
  for r in 0 .. greatest(cols, rows_) loop
    for dy in -r .. r loop
      for dx in -r .. r loop
        continue when greatest(abs(dx), abs(dy)) <> r;
        nx := cx + dx; ny := cy + dy;
        continue when nx < 0 or ny < 0 or nx >= cols or ny >= rows_;
        if not exists (select 1 from prg_tokens o where o.cena_id = c_id and o.id <> p_token and o.x = nx and o.y = ny) then
          update prg_tokens set x = nx, y = ny where id = p_token;
          return query select nx, ny; return;
        end if;
      end loop;
    end loop;
  end loop;
  return query select t.x, t.y from prg_tokens t where t.id = p_token;
end $$;
revoke all on function public.prg_token_casa_livre(uuid) from public, anon, authenticated;
