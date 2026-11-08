-- Somente no Supabase (usa o schema storage): bucket público para imagens de mapas/tokens.
-- O envio é feito pela API do servidor (/api/prg/mesa/:id/upload), só pelo mestre.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prg-mesa', 'prg-mesa', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;
