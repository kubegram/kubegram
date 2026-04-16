-- Test projects (3 projects)
INSERT INTO projects (id, name, graph_id, graph_meta, team_id, created_by, created_at, updated_at)
VALUES 
  (1, 'Project Alpha', 'graph_alpha', '{}', 1, 1, now(), now()),
  (2, 'Project Beta', 'graph_beta', '{}', 2, 2, now(), now()),
  (3, 'Project Gamma', 'graph_gamma', '{}', 3, 3, now(), now());
