-- PRG System v0.37.0 — @usuario, convite pelo @, fichas desvinculadas e feedback.
-- Idempotente. Tudo continua acessível só pela API do servidor (RLS ligado, sem políticas).

-- 1) @usuario: nome único, curto e fácil de digitar (tipo Discord/X). O apelido continua livre. ----------------
alter table public.prg_public_adventurers add column if not exists usuario text;

-- Base do @ a partir do apelido: sem acento, minúsculo, espaços viram "_", só [a-z0-9_.], até 20 letras.
create or replace function public.prg_base_usuario(p text) returns text language sql immutable as $$
  select trim(both '._' from left(regexp_replace(regexp_replace(regexp_replace(lower(translate(coalesce(p, ''),
    'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ', 'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn')),
    '\s+', '_', 'g'), '[^a-z0-9_.]', '', 'g'), '\.{2,}', '.', 'g'), 20))
$$;

-- @ livre: se já existir, acrescenta um número (lua, lua2, lua3...).
create or replace function public.prg_gerar_usuario(p_apelido text, p_id uuid) returns text
language plpgsql set search_path = public as $$
declare base text := public.prg_base_usuario(p_apelido); cand text; n int := 1;
begin
  if char_length(base) < 3 then base := 'aventureiro'; end if;
  cand := base;
  while exists (select 1 from public.prg_public_adventurers where usuario = cand and id <> p_id) loop
    n := n + 1;
    cand := trim(both '._' from left(base, 20 - char_length(n::text))) || n::text;
  end loop;
  return cand;
end $$;

-- Perfis antigos ganham um @ (um por vez, para os repetidos virarem lua, lua2...).
do $$ declare r record; begin
  for r in select id, apelido from public.prg_public_adventurers where usuario is null order by created_at, id loop
    update public.prg_public_adventurers set usuario = public.prg_gerar_usuario(r.apelido, r.id) where id = r.id;
  end loop;
end $$;

-- Perfis novos: se a API não mandar o @, o banco cria um.
create or replace function public.prg_usuario_padrao() returns trigger language plpgsql set search_path = public as $$
begin
  if new.usuario is null or new.usuario = '' then new.usuario := public.prg_gerar_usuario(new.apelido, new.id); end if;
  return new;
end $$;
drop trigger if exists prg_usuario_padrao on public.prg_public_adventurers;
create trigger prg_usuario_padrao before insert on public.prg_public_adventurers
  for each row execute function public.prg_usuario_padrao();

alter table public.prg_public_adventurers alter column usuario set not null;
do $$ begin
  alter table public.prg_public_adventurers add constraint prg_usuario_formato
    check (usuario ~ '^[a-z0-9_.]{3,20}$' and usuario !~ '^[.]|[.]$|[.]{2}');
exception when duplicate_object then null; end $$;
create unique index if not exists prg_public_adventurers_usuario_unique on public.prg_public_adventurers (usuario);

-- 2) Convite pelo @: um convite de uso único para uma pessoa só. Quem recebe entra direto (o mestre já escolheu). ---
alter table public.prg_convites add column if not exists para_id uuid references public.prg_public_adventurers(id) on delete cascade;
create index if not exists prg_convites_para_idx on public.prg_convites (para_id) where para_id is not null;

-- 3) Fichas que ficaram "arquivadas" quando o jogador saiu (antes da v0.37.0) voltam para ele. ---------------------
--    Cópia enviada que nunca foi mexida e cuja original ainda existe: some (a original continua com ele).
delete from public.prg_fichas f
 where f.status = 'arquivada' and not f.npc and f.campanha_id is not null and f.versao <= 1
   and exists (select 1 from public.prg_fichas o where o.id = f.origem_id and o.dono_id = f.dono_id)
   and not exists (select 1 from public.prg_campanha_membros m where m.campanha_id = f.campanha_id and m.aventureiro_id = f.dono_id);
--    As outras viram fichas avulsas do jogador, com o nome da campanha para ele saber de onde vieram.
update public.prg_tokens t set ficha_id = null
  from public.prg_fichas f
 where t.ficha_id = f.id and f.status = 'arquivada' and not f.npc and f.campanha_id is not null
   and not exists (select 1 from public.prg_campanha_membros m where m.campanha_id = f.campanha_id and m.aventureiro_id = f.dono_id);
update public.prg_fichas f
   set campanha_id = null, status = 'ativa', bloqueada = false, areas_bloqueadas = '{}', observacao_mestre = '', oculta = false,
       nome = left(coalesce(nullif(f.nome, ''), 'Personagem') || ' (de ' || c.nome || ')', 90)
  from public.prg_campanhas c
 where f.campanha_id = c.id and f.status = 'arquivada' and not f.npc
   and not exists (select 1 from public.prg_campanha_membros m where m.campanha_id = f.campanha_id and m.aventureiro_id = f.dono_id);

-- 4) Feedback: guardado aqui e avisado no Discord do Wed (webhook só no servidor). Nunca por e-mail. ----------------
create table if not exists public.prg_feedback (
  id bigserial primary key,
  autor_id uuid references public.prg_public_adventurers(id) on delete set null,
  tipo text not null default 'ideia' check (tipo in ('ideia','problema','elogio','outro')),
  texto text not null check (char_length(texto) between 3 and 1500),
  pagina text not null default '' check (char_length(pagina) <= 200),
  enviado boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists prg_feedback_autor_idx on public.prg_feedback (autor_id, criado_em desc);
create index if not exists prg_feedback_data_idx on public.prg_feedback (criado_em desc);
alter table public.prg_feedback enable row level security;
revoke all on public.prg_feedback from anon, authenticated;
grant select, insert, update, delete on public.prg_feedback to service_role;
grant usage, select on sequence public.prg_feedback_id_seq to service_role;
