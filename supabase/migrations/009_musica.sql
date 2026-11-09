-- PRG System — v0.7.0: música na mesa (playlists do mestre e dos jogadores, música tocando para todos).
-- Aditiva. Acesso só pela API do servidor.

create table if not exists public.prg_playlists (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.prg_campanhas(id) on delete cascade,
  dono_id uuid not null references public.prg_public_adventurers(id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 80),
  enviada boolean not null default false,          -- jogador enviou ao mestre
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);
create index if not exists prg_playlists_campanha_idx on public.prg_playlists (campanha_id, dono_id);

create table if not exists public.prg_musicas (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.prg_playlists(id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 200),
  url text not null check (char_length(url) <= 1000),
  tipo text not null check (tipo in ('youtube','audio')),
  video_id text check (video_id is null or video_id ~ '^[A-Za-z0-9_-]{11}$'),
  ordem int not null default 0,
  criada_em timestamptz not null default now()
);
create index if not exists prg_musicas_playlist_idx on public.prg_musicas (playlist_id, ordem);

-- O que está tocando na mesa: {musica_id, titulo, url, tipo, video_id, loop, tocando, iniciada_em, por}
alter table public.prg_campanhas add column if not exists musica jsonb not null default '{"tocando":false}'::jsonb;

alter table public.prg_playlists enable row level security;
alter table public.prg_musicas enable row level security;
revoke all on public.prg_playlists, public.prg_musicas from anon, authenticated;
grant all on public.prg_playlists, public.prg_musicas to service_role;
