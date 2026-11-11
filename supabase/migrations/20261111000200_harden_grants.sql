-- Defense in depth. RLS already guards row access; this removes privileges nobody needs.
-- The app only queries as signed-in users (authenticated); the backend uses the service role.
-- TRUNCATE, REFERENCES and TRIGGER are not subject to RLS, so no client role should hold them.

revoke all on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Keep future tables from inheriting the broad defaults.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke truncate, references, trigger on tables from authenticated;
