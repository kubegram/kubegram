-- Test organizations fixture
INSERT INTO organizations (id, name, company_id) VALUES
  (1, 'Engineering', '11111111-1111-1111-1111-111111111111'::uuid),
  (2, 'Product', '11111111-1111-1111-1111-111111111111'::uuid),
  (3, 'DevOps', '22222222-2222-2222-2222-222222222222'::uuid);
