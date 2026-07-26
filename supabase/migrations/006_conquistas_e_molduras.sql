-- ============================================================
-- PRG System — Conquistas/marcos da campanha + molduras de token
-- Execute este arquivo DEPOIS do 005_musica_mesa.sql
-- ============================================================

-- ── Conquistas: marcos da história marcados pelo mestre ──
CREATE TABLE public.conquistas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE NOT NULL,
  titulo      TEXT NOT NULL,
  descricao   TEXT NOT NULL DEFAULT '',
  emoji       TEXT NOT NULL DEFAULT '🏆',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.conquistas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conquistas visíveis a membros da campanha"
  ON public.conquistas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campanha_players
      WHERE campanha_id = conquistas.campanha_id AND player_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = conquistas.campanha_id AND mestre_id = auth.uid()
    )
  );

CREATE POLICY "Mestre cria conquistas"
  ON public.conquistas FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.campanhas WHERE id = conquistas.campanha_id AND mestre_id = auth.uid())
  );

CREATE POLICY "Mestre apaga conquistas"
  ON public.conquistas FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.campanhas WHERE id = conquistas.campanha_id AND mestre_id = auth.uid())
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.conquistas;

-- ── Moldura animada de avatar/token (dourada, arcana, gelo, chamas, dragão) ──
ALTER TABLE public.personagens
  ADD COLUMN moldura TEXT;
