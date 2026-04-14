-- Test sessions fixture (for mock auth)
INSERT INTO openauth_sessions (id, subject, provider, access_token, expires_at) VALUES
  ('session-admin-001', 'admin@test.com', 'github', 'access_token_admin', now() + interval '1 day'),
  ('session-manager-001', 'manager@test.com', 'github', 'access_token_manager', now() + interval '1 day'),
  ('session-member1-001', 'member1@test.com', 'github', 'access_token_member1', now() + interval '1 day'),
  ('session-demo-001', 'demo@test.com', 'github', 'access_token_demo', now() + interval '1 day');
