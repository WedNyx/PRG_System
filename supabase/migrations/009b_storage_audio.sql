-- Somente no Supabase: o bucket prg-mesa passa a aceitar áudio (até 15 MB) além de imagens.
update storage.buckets
   set file_size_limit = 15728640,
       allowed_mime_types = array['image/png','image/jpeg','image/webp','audio/mpeg','audio/ogg','audio/wav','audio/x-wav','audio/mp4','audio/aac','audio/webm']
 where id = 'prg-mesa';
