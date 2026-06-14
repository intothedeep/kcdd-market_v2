-- Realtime configuration for Supabase

CREATE SCHEMA IF NOT EXISTS realtime;

-- Create realtime schema and tables
-- This is managed by Supabase's realtime service

-- Enable realtime for specific tables
-- ALTER PUBLICATION supabase_realtime ADD TABLE requests;
-- ALTER PUBLICATION supabase_realtime ADD TABLE request_notifications;

COMMIT;

