-- Test generation jobs fixture
INSERT INTO generation_jobs (id, uuid, graph_id, project_id, requested_by, status, config, result_data, progress) VALUES
  (1, 'job-uuid-001'::uuid, 'graph-uuid-001', 1, 1, 'completed', '{"provider": "claude"}', '{"files": ["deployment.yaml"]}', 100),
  (2, 'job-uuid-002'::uuid, 'graph-uuid-002', 2, 2, 'pending', '{"provider": "openai"}', NULL, 0),
  (3, 'job-uuid-003'::uuid, 'graph-uuid-003', 3, 5, 'failed', '{"provider": "claude"}', NULL, 50);
