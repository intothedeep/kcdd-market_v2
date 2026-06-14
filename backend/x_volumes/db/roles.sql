-- Create required database roles for Supabase

-- Create authenticator role
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'your-super-secret-password';

-- Create anon role for anonymous access
CREATE ROLE anon NOLOGIN;
GRANT anon TO authenticator;

-- Create authenticated role for logged-in users
CREATE ROLE authenticated NOLOGIN;
GRANT authenticated TO authenticator;

-- Create service_role for administrative tasks
CREATE ROLE service_role NOLOGIN BYPASSRLS;
GRANT service_role TO authenticator;

-- Create supabase_admin role
CREATE ROLE supabase_admin NOLOGIN;
GRANT supabase_admin TO authenticator;

-- Create supabase_auth_admin role
CREATE ROLE supabase_auth_admin NOLOGIN;
GRANT supabase_auth_admin TO authenticator;

-- Create supabase_storage_admin role
CREATE ROLE supabase_storage_admin NOLOGIN;
GRANT supabase_storage_admin TO authenticator;

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

