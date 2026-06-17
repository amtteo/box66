-- handle_new_user sa spúšťa výhradne cez trigger na auth.users (ako vlastník
-- tabuľky). Nesmie byť volateľná cez Data API (PostgREST RPC), preto jej
-- odoberieme EXECUTE. Bez toho hlási security advisor WARN
-- (anon/authenticated_security_definer_function_executable).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
