-- The server-only service-role client bypasses RLS, but still needs PostgreSQL
-- object privileges to manage the admin dashboard's data.
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
