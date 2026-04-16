-- Test generation jobs (3 jobs)
INSERT INTO generation_jobs (id, uuid, graph_id, project_id, requested_by, status, config, result_data, error_message, progress, started_at, completed_at, created_at, updated_at)
VALUES 
  (1, gen_random_uuid(), 'graph_alpha', 1, 1, 'completed', '{}', '{"output": "test"}', null, 100, now() - interval '1 hour', now(), now(), now()),
  (2, gen_random_uuid(), 'graph_beta', 2, 2, 'pending', '{}', null, null, 0, null, null, now(), now()),
  (3, gen_random_uuid(), 'graph_gamma', 3, 3, 'running', '{}', null, null, 50, now() - interval '30 minutes', null, now(), now());
