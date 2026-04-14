-- Test companies fixture
INSERT INTO companies (id, name, tokens) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Test Company Inc', 1000),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Acme Corp', 500),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Demo Organization', 100);
