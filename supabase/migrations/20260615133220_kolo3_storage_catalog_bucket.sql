-- Kolo 3: Storage bucket pre obrázky globálneho katalógu
--
-- Tento súbor zrkadlí Supabase migráciu nasadenú do projektu box66
-- (verzia 20260615133220). Bucket `catalog` slúži na obrázky kategórií
-- a produktov. Čítanie je verejné (public URL), zápis/mazanie robí výhradne
-- service-role klient v Server Actions (obchádza RLS) — preto nepotrebujeme
-- politiky pre insert/update/delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog',
  'catalog',
  true,
  4194304, -- 4 MB
  array['image/png','image/jpeg','image/webp','image/avif','image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Pozn.: Public bucket sa číta cez verejné URL bez RLS politiky. Žiadnu širokú
-- SELECT politiku na storage.objects zámerne nepridávame (umožnila by listovanie
-- všetkých súborov — viď security advisor 0025).
