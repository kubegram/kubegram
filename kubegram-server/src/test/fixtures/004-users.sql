-- Test users (5 users with different roles)
-- Note: team_id references are set after teams are created
INSERT INTO users (id, name, email, avatar_url, role, provider, provider_id, team_id, created_at, updated_at)
VALUES 
  (1, 'Admin User', 'admin@test.com', null, 'admin', 'github', 'gh_admin', 1, now(), now()),
  (2, 'Manager User', 'manager@test.com', null, 'manager', 'github', 'gh_manager', 1, now(), now()),
  (3, 'Team Member One', 'member1@test.com', null, 'team_member', 'github', 'gh_member1', 2, now(), now()),
  (4, 'Team Member Two', 'member2@test.com', null, 'team_member', 'github', 'gh_member2', 2, now(), now()),
  (5, 'Team Member Three', 'member3@test.com', null, 'team_member', 'google', 'gg_member3', 3, now(), now());
