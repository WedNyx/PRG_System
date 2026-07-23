-- ============================================================
-- PRG System — Desenho à mão livre no mapa
-- Execute este arquivo DEPOIS do 003_mesa_pro.sql
-- ============================================================

CREATE TABLE public.desenhos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE NOT NULL,
  autor_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  cor         TEXT NOT NULL DEFAULT '#fbbf24',
  pontos      JSONB NOT NULL DEFAULT '[]',  -- [x1, y1, x2, y2, ...] em pixels do grid
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.desenhos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Desenhos visíveis a membros da campanha"
  ON public.desenhos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campanha_players
      WHERE campanha_id = desenhos.campanha_id AND player_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = desenhos.campanha_id AND mestre_id = auth.uid()
    )
  );

CREATE POLICY "Membros desenham"
  ON public.desenhos FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.campanha_players
        WHERE campanha_id = desenhos.campanha_id AND player_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.campanhas
        WHERE id = desenhos.campanha_id AND mestre_id = auth.uid()
      )
    )
  );

CREATE POLICY "Autor ou mestre apaga desenhos"
  ON public.desenhos FOR DELETE TO authenticated
  USING (
    autor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = desenhos.campanha_id AND mestre_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.desenhos;
