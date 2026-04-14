-- Test projects fixture
INSERT INTO projects (id, name, graph_id, graph_meta, team_id, created_by) VALUES
  (1, 'Kubernetes Cluster', 'graph-uuid-001', '{"version": "1.0"}', 1, 1),
  (2, 'Microservices App', 'graph-uuid-002', '{"version": "2.0"}', 2, 2),
  (3, 'Demo Project', 'graph-uuid-003', '{"version": "1.0"}', 4, 5);
