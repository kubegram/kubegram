-- Test sessions (4 sessions)
INSERT INTO openauth_sessions (id, subject, provider, access_token, refresh_token, expires_at, created_at, updated_at)
VALUES 
  ('session_001', 'admin@test.com', 'github', 'token_001', 'refresh_001', now() + interval '24 hours', now(), now()),
  ('session_002', 'manager@test.com', 'github', 'token_002', 'refresh_002', now() + interval '24 hours', now(), now()),
  ('session_003', 'member1@test.com', 'github', 'token_003', 'refresh_003', now() + interval '24 hours', now(), now()),
  ('session_004', 'member2@test.com', 'github', 'token_004', 'refresh_004', now() - interval '1 hour', now(), now());
