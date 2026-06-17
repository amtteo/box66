-- Kolo 3: odstránenie širokej SELECT politiky na storage.objects pre bucket `catalog`.
--
-- Tento súbor zrkadlí Supabase migráciu nasadenú do projektu box66.
-- Public bucket sa číta cez verejné URL aj bez politiky; široká SELECT politika
-- by navyše umožnila klientom listovať všetky súbory v buckete
-- (security advisor 0025 – public_bucket_allows_listing).

drop policy if exists catalog_public_read on storage.objects;
