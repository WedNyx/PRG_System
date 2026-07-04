-- ============================================================
-- PRG System — Schema inicial
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Profiles (dados públicos do usuário)
CREATE TABLE public.profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username   TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis visíveis a usuários autenticados"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuário edita o próprio perfil"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Cria perfil automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Campanhas
CREATE TABLE public.campanhas (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome           TEXT NOT NULL,
  descricao      TEXT,
  sistema        TEXT NOT NULL DEFAULT 'custom',
  codigo_convite TEXT UNIQUE NOT NULL DEFAULT upper(substring(gen_random_uuid()::text FROM 1 FOR 8)),
  mestre_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  imagem_url     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campanha visível para mestre e players"
  ON public.campanhas FOR SELECT TO authenticated
  USING (
    mestre_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campanha_players
      WHERE campanha_id = campanhas.id AND player_id = auth.uid()
    )
  );

CREATE POLICY "Mestre cria campanhas"
  ON public.campanhas FOR INSERT TO authenticated
  WITH CHECK (mestre_id = auth.uid());

CREATE POLICY "Mestre atualiza suas campanhas"
  ON public.campanhas FOR UPDATE TO authenticated
  USING (mestre_id = auth.uid());

CREATE POLICY "Mestre deleta suas campanhas"
  ON public.campanhas FOR DELETE TO authenticated
  USING (mestre_id = auth.uid());

-- Players em campanhas
CREATE TABLE public.campanha_players (
  campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE NOT NULL,
  player_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (campanha_id, player_id)
);

ALTER TABLE public.campanha_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Player vê suas participações"
  ON public.campanha_players FOR SELECT TO authenticated
  USING (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = campanha_id AND mestre_id = auth.uid()
    )
  );

CREATE POLICY "Player entra na campanha"
  ON public.campanha_players FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());

-- Personagens (fichas + NPCs)
CREATE TABLE public.personagens (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE NOT NULL,
  player_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nome        TEXT NOT NULL,
  is_npc      BOOLEAN DEFAULT FALSE NOT NULL,
  dados       JSONB NOT NULL DEFAULT '{}',  -- conteúdo da ficha (flexível por sistema)
  pos_x       INTEGER DEFAULT 0 NOT NULL,
  pos_y       INTEGER DEFAULT 0 NOT NULL,
  token_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.personagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personagem visível a membros da campanha"
  ON public.personagens FOR SELECT TO authenticated
  USING (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = personagens.campanha_id AND mestre_id = auth.uid()
    )
    OR (
      is_npc = FALSE
      AND EXISTS (
        SELECT 1 FROM public.campanha_players
        WHERE campanha_id = personagens.campanha_id AND player_id = auth.uid()
      )
    )
  );

CREATE POLICY "Player gerencia seu personagem"
  ON public.personagens FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid() AND is_npc = FALSE);

CREATE POLICY "Player atualiza seu personagem"
  ON public.personagens FOR UPDATE TO authenticated
  USING (player_id = auth.uid());

CREATE POLICY "Mestre gerencia NPCs"
  ON public.personagens FOR INSERT TO authenticated
  WITH CHECK (
    is_npc = TRUE
    AND EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = personagens.campanha_id AND mestre_id = auth.uid()
    )
  );

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER personagens_updated_at
  BEFORE UPDATE ON public.personagens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Rolagens de dados (histórico no chat da sessão)
CREATE TABLE public.rolagens (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE NOT NULL,
  player_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  expressao   TEXT NOT NULL,   -- ex: "2d6+3", "1d20"
  resultados  INTEGER[] NOT NULL,
  total       INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.rolagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rolagens visíveis a membros da campanha"
  ON public.rolagens FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campanha_players
      WHERE campanha_id = rolagens.campanha_id AND player_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.campanhas
      WHERE id = rolagens.campanha_id AND mestre_id = auth.uid()
    )
  );

CREATE POLICY "Membros registram rolagens"
  ON public.rolagens FOR INSERT TO authenticated
  WITH CHECK (
    player_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.campanha_players
        WHERE campanha_id = rolagens.campanha_id AND player_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.campanhas
        WHERE id = rolagens.campanha_id AND mestre_id = auth.uid()
      )
    )
  );

-- Habilitar Realtime para sincronização ao vivo
ALTER PUBLICATION supabase_realtime ADD TABLE public.personagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rolagens;
