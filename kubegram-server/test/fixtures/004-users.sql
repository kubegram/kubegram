-- Test users fixture
INSERT INTO users (id, name, email, avatar_url, role, provider, provider_id, team_id) VALUES
  (1, 'Admin User', 'admin@test.com', 'https://example.com/avatar1.png', 'admin', 'github', 'github_1', 1),
  (2, 'Manager User', 'manager@test.com', 'https://example.com/avatar2.png', 'manager', 'github', 'github_2', 1),
  (3, 'Team Member One', 'member1@test.com', 'https://example.com/avatar3.png', 'team_member', 'github', 'github_3', 2),
  (4, 'Team Member Two', 'member2@test.com', 'https://example.com/avatar4.png', 'team_member', 'google', 'google_4', 3),
  (5, 'Demo User', 'demo@test.com', 'https://example.com/avatar5.png', 'team_member', 'github', 'github_5', 4);
