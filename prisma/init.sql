-- Database initialization script for multi-tenant lesson platform
-- This script sets up PostgreSQL with Row-Level Security (RLS)

-- Create database and user (run as postgres superuser)
-- CREATE DATABASE lesson_platform_db;
-- CREATE USER lesson_user WITH PASSWORD 'lesson_password';
-- GRANT ALL PRIVILEGES ON DATABASE lesson_platform_db TO lesson_user;
-- ALTER USER lesson_user CREATEDB;

-- Connect to the lesson_platform_db database
\c lesson_platform_db;

-- Enable Row Level Security extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to get current tenant ID from session
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.tenant_id', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id TEXT) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.tenant_id', tenant_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO lesson_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO lesson_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO lesson_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO lesson_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO lesson_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO lesson_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO lesson_user;

COMMIT;