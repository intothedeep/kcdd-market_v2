-- JWT setup for Supabase
-- Using pgcrypto for JWT functionality

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- JWT functions will be provided by the Supabase services
COMMIT;
