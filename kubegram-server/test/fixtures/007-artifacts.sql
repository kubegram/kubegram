-- Test generation job artifacts fixture
INSERT INTO generation_job_artifacts (job_id, type, name, content, size) VALUES
  (1, 'file', 'deployment.yaml', 'apiVersion: apps/v1\nkind: Deployment', 1024),
  (1, 'file', 'service.yaml', 'apiVersion: v1\nkind: Service', 512),
  (1, 'metadata', 'manifest.json', '{"files": 2}', 128);
