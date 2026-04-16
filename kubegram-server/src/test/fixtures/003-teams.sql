-- Test teams (4 teams)
INSERT INTO teams (id, name, organization_id, created_at, updated_at)
VALUES 
  (1, 'Platform Team', 1, now(), now()),
  (2, 'Backend Team', 1, now(), now()),
  (3, 'Frontend Team', 1, now(), now()),
  (4, 'Growth Team', 2, now(), now());
