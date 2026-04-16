-- Test organizations (3 organizations)
INSERT INTO organizations (id, name, company_id, created_at, updated_at)
VALUES 
  (1, 'Engineering', '550e8400-e29b-41d4-a716-446655440000', now(), now()),
  (2, 'Marketing', '550e8400-e29b-41d4-a716-446655440000', now(), now()),
  (3, 'Sales', '550e8400-e29b-41d4-a716-446655440001', now(), now());
