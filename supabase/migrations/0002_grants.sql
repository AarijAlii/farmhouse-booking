-- The project was created with "automatically expose new tables" disabled, so new
-- tables get no default grants. Grant access to service_role only — the API's key.
-- anon and authenticated get nothing: all access goes through our server.

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Same for tables created by future migrations.
alter default privileges in schema public grant all privileges on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
