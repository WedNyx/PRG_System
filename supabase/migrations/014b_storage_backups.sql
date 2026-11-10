-- Somente no Supabase: pasta PRIVADA para as cópias de segurança diárias (só o servidor acessa).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prg-backups', 'prg-backups', false, 52428800, array['application/json'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
