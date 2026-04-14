-- Test operator tokens fixture
INSERT INTO operator_tokens (id, token, company_id, cluster_id, label) VALUES
  (1, 'test-operator-token-001', '11111111-1111-1111-1111-111111111111'::uuid, 'cluster-001', 'Production Cluster'),
  (2, 'test-operator-token-002', '22222222-2222-2222-2222-222222222222'::uuid, 'cluster-002', 'Staging Cluster');

-- Test operators fixture
INSERT INTO operators (id, cluster_id, token_id, company_id, version, mcp_endpoint, status) VALUES
  (1, 'cluster-001', 1, '11111111-1111-1111-1111-111111111111'::uuid, '1.0.0', 'http://operator-001:8080', 'online'),
  (2, 'cluster-002', 2, '22222222-2222-2222-2222-222222222222'::uuid, '1.0.0', 'http://operator-002:8080', 'offline');
