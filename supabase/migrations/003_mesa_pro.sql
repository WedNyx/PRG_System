-- ============================================================
-- PRG System — Recursos profissionais da mesa
-- Execute este arquivo DEPOIS do 002_mesa_e_fichas.sql
-- ============================================================

-- Campanhas: marcador de turno da iniciativa e journal
ALTER TABLE public.campanhas
  ADD COLUMN iniciativa_turno INTEGER NOT NULL DEFAULT 0;

-- Personagens: condições de combate e macros de rolagem
ALTER TABLE public.personagens
  ADD COLUMN condicoes JSONB NOT NULL DEFAULT '[]',  -- ["envenenado", "caido", ...]
  ADD COLUMN macros    JSONB NOT NULL DEFAULT '[]';  -- [{"nome": "Ataque", "expressao": "1d20+7"}]

-- Mensagens: tipos (fala, ooc, emote, sussurro) e destinatário
ALTER TABLE public.mensagens
  ADD COLUMN tipo TEXT NOT NULL DEFAULT 'fala',
  ADD COLUMN destinatario_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Sussurros só aparecem para remetente, destinatário e mestre
DROP POLICY "Mensagens visíveis a membros da campanha" ON public.mensagens;

CREATE POLICY "Mensagens visíveis a membros da campanha"
  ON public.mensagens FOR SELECT TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.campanha_players
        WHERE campanha_id = mensagens.campanha_id AND player_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.campanhas
        WHERE id = mensagens.campanha_id AND mestre_id = auth.uid()
      )
    )
    AND (
      tipo <> 'sussurro'
      OR player_id = auth.uid()
      OR destinatario_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.campanhas
        WHERE id = mensagens.campanha_id AND mestre_id = auth.uid()
      )
    )
  );

-- ── Cenas (mapas salvos da campanha) ──────────────────────────

CREATE TABLE public.cenas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE NOT NULL,
  nome        TEXT NOT NULL,
  mapa_url    TEXT,
  grid_cols   INTEGER NOT NULL DEFAULT 30,
  grid_rows   INTEGER NOT NULL DEFAULT 20,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.cenas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Só o mestre gerencia cenas"
  ON public.cenas FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = cenas.campanha_id AND mestre_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = cenas.campanha_id AND mestre_id = auth.uid()
    )
  );

-- ── Handouts (cartas, imagens e segredos para players) ────────

CREATE TABLE public.handouts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id   UUID REFERENCES public.campanhas(id) ON DELETE CASCADE NOT NULL,
  titulo        TEXT NOT NULL,
  conteudo      TEXT NOT NULL DEFAULT '',
  imagem_url    TEXT,
  para_todos    BOOLEAN NOT NULL DEFAULT TRUE,
  destinatarios UUID[] NOT NULL DEFAULT '{}',
  visivel       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.handouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mestre gerencia handouts"
  ON public.handouts FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = handouts.campanha_id AND mestre_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = handouts.campanha_id AND mestre_id = auth.uid()
    )
  );

CREATE POLICY "Players veem handouts liberados"
  ON public.handouts FOR SELECT TO authenticated
  USING (
    visivel = TRUE
    AND (para_todos = TRUE OR auth.uid() = ANY(destinatarios))
    AND EXISTS (
      SELECT 1 FROM public.campanha_players
      WHERE campanha_id = handouts.campanha_id AND player_id = auth.uid()
    )
  );

-- ── Journal compartilhado (diário da campanha) ────────────────

CREATE TABLE public.journal (
  campanha_id UUID PRIMARY KEY REFERENCES public.campanhas(id) ON DELETE CASCADE,
  conteudo    TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros leem e escrevem no journal"
  ON public.journal FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campanha_players
      WHERE campanha_id = journal.campanha_id AND player_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = journal.campanha_id AND mestre_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campanha_players
      WHERE campanha_id = journal.campanha_id AND player_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = journal.campanha_id AND mestre_id = auth.uid()
    )
  );

-- ── Storage: bucket público de imagens (mapas e tokens) ───────

INSERT INTO storage.buckets (id, name, public)
VALUES ('imagens', 'imagens', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Autenticados fazem upload de imagens"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'imagens');

CREATE POLICY "Leitura pública de imagens"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'imagens');

-- ── Realtime ───────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.handouts;
