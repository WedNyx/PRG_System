-- ============================================================
-- PRG System — Música ambiente na mesa
-- Execute este arquivo DEPOIS do 004_desenhos.sql
-- ============================================================

ALTER TABLE public.campanhas
  ADD COLUMN musica_mesa JSONB;
-- Formato: { "videoId": "...", "titulo": "...", "tocando": true }
-- NULL quando nenhuma música está tocando. A tabela já está na
-- publicação supabase_realtime e já tem RLS restringindo UPDATE
-- ao mestre da campanha, então não precisa de nada mais aqui.
