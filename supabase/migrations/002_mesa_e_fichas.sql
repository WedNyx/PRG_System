-- ============================================================
-- PRG System — Mesa ao vivo, fichas, chat e ferramentas do mestre
-- Execute este arquivo DEPOIS do 001_initial.sql
-- ============================================================

-- Campanhas: mapa, fog of war e iniciativa
ALTER TABLE public.campanhas
  ADD COLUMN mapa_url     TEXT,
  ADD COLUMN grid_cols    INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN grid_rows    INTEGER NOT NULL DEFAULT 20,
  ADD COLUMN fog_ativo    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN fog_revelado JSONB   NOT NULL DEFAULT '[]',  -- células reveladas ["x,y", ...]
  ADD COLUMN iniciativa   JSONB   NOT NULL DEFAULT '[]';  -- [{"nome": "...", "valor": 18}, ...]

-- Personagens: HP, cor do token e visibilidade (para NPCs escondidos)
ALTER TABLE public.personagens
  ADD COLUMN hp_atual INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN hp_max   INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN cor      TEXT    NOT NULL DEFAULT '#f59e0b',
  ADD COLUMN visivel  BOOLEAN NOT NULL DEFAULT TRUE;

-- Rolagens secretas do mestre
ALTER TABLE public.rolagens
  ADD COLUMN is_secreta BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Políticas atualizadas de personagens ──────────────────────

DROP POLICY "Personagem visível a membros da campanha" ON public.personagens;

CREATE POLICY "Personagem visível a membros da campanha"
  ON public.personagens FOR SELECT TO authenticated
  USING (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = personagens.campanha_id AND mestre_id = auth.uid()
    )
    OR (
      visivel = TRUE
      AND EXISTS (
        SELECT 1 FROM public.campanha_players
        WHERE campanha_id = personagens.campanha_id AND player_id = auth.uid()
      )
    )
  );

CREATE POLICY "Mestre atualiza personagens da campanha"
  ON public.personagens FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = personagens.campanha_id AND mestre_id = auth.uid()
    )
  );

CREATE POLICY "Player deleta seu personagem"
  ON public.personagens FOR DELETE TO authenticated
  USING (player_id = auth.uid());

CREATE POLICY "Mestre deleta personagens da campanha"
  ON public.personagens FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = personagens.campanha_id AND mestre_id = auth.uid()
    )
  );

-- ── Rolagens: esconder rolagens secretas dos players ──────────

DROP POLICY "Rolagens visíveis a membros da campanha" ON public.rolagens;

CREATE POLICY "Rolagens visíveis a membros da campanha"
  ON public.rolagens FOR SELECT TO authenticated
  USING (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = rolagens.campanha_id AND mestre_id = auth.uid()
    )
    OR (
      is_secreta = FALSE
      AND EXISTS (
        SELECT 1 FROM public.campanha_players
        WHERE campanha_id = rolagens.campanha_id AND player_id = auth.uid()
      )
    )
  );

-- ── Chat da mesa ───────────────────────────────────────────────

CREATE TABLE public.mensagens (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE NOT NULL,
  player_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  conteudo    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mensagens visíveis a membros da campanha"
  ON public.mensagens FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campanha_players
      WHERE campanha_id = mensagens.campanha_id AND player_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = mensagens.campanha_id AND mestre_id = auth.uid()
    )
  );

CREATE POLICY "Membros enviam mensagens"
  ON public.mensagens FOR INSERT TO authenticated
  WITH CHECK (
    player_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.campanha_players
        WHERE campanha_id = mensagens.campanha_id AND player_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.campanhas
        WHERE id = mensagens.campanha_id AND mestre_id = auth.uid()
      )
    )
  );

-- ── Notas secretas do mestre ───────────────────────────────────

CREATE TABLE public.notas (
  campanha_id UUID PRIMARY KEY REFERENCES public.campanhas(id) ON DELETE CASCADE,
  conteudo    TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Só o mestre acessa as notas"
  ON public.notas FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = notas.campanha_id AND mestre_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = notas.campanha_id AND mestre_id = auth.uid()
    )
  );

-- ── Entrar em campanha com código de convite ──────────────────
-- SECURITY DEFINER: o player ainda não é membro, então não
-- conseguiria SELECT na campanha pelo RLS. Esta função busca o
-- código e insere a participação de forma segura.

CREATE OR REPLACE FUNCTION public.entrar_com_codigo(codigo TEXT)
RETURNS UUID AS $$
DECLARE
  camp_id UUID;
BEGIN
  SELECT id INTO camp_id
  FROM public.campanhas
  WHERE codigo_convite = upper(trim(codigo));

  IF camp_id IS NULL THEN
    RAISE EXCEPTION 'Código de convite inválido';
  END IF;

  INSERT INTO public.campanha_players (campanha_id, player_id)
  VALUES (camp_id, auth.uid())
  ON CONFLICT DO NOTHING;

  RETURN camp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Realtime ───────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campanhas;
