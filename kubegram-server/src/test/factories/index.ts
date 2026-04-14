import type { InferInsertModel } from 'drizzle-orm';
import type {
  companies,
  organizations,
  teams,
  users,
  projects,
  generationJobs,
  generationJobArtifacts,
  operatorTokens,
  operators,
} from '../../db/schema';

export type CompanyInsert = InferInsertModel<typeof companies>;
export type OrganizationInsert = InferInsertModel<typeof organizations>;
export type TeamInsert = InferInsertModel<typeof teams>;
export type UserInsert = InferInsertModel<typeof users>;
export type ProjectInsert = InferInsertModel<typeof projects>;
export type GenerationJobInsert = InferInsertModel<typeof generationJobs>;
export type GenerationJobArtifactInsert = InferInsertModel<typeof generationJobArtifacts>;
export type OperatorTokenInsert = InferInsertModel<typeof operatorTokens>;
export type OperatorInsert = InferInsertModel<typeof operators>;

let idCounter = 10000;

function generateId(): number {
  return ++idCounter;
}

function generateUuid(): string {
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateToken(): string {
  return `tok_${generateUuid().replace(/-/g, '')}`;
}

function generateSessionId(): string {
  return `sess_${generateUuid().replace(/-/g, '')}`;
}

export const companyFactory = {
  create: (overrides: Partial<CompanyInsert> = {}): CompanyInsert => ({
    id: generateUuid() as any,
    name: 'Test Company',
    tokens: 100,
    ...overrides,
  }),

  createMultiple: (count: number, overrides: Partial<CompanyInsert> = {}): CompanyInsert[] => {
    return Array.from({ length: count }, (_, i) =>
      companyFactory.create({
        ...overrides,
        name: overrides.name || `Company ${i + 1}`,
      })
    );
  },

  createWithRelations: (overrides: Partial<CompanyInsert> = {}) => {
    const company = companyFactory.create(overrides);
    const organization = organizationFactory.create({ companyId: company.id });
    const team = teamFactory.create({ organizationId: organization.id });
    const user = userFactory.create({ teamId: team.id, companyId: company.id });

    return { company, organization, team, user };
  },
};

export const organizationFactory = {
  create: (overrides: Partial<OrganizationInsert> = {}): OrganizationInsert => ({
    id: generateId(),
    name: 'Test Organization',
    companyId: undefined,
    ...overrides,
  }),

  createMultiple: (count: number, overrides: Partial<OrganizationInsert> = {}): OrganizationInsert[] => {
    return Array.from({ length: count }, (_, i) =>
      organizationFactory.create({
        ...overrides,
        name: overrides.name || `Organization ${i + 1}`,
      })
    );
  },
};

export const teamFactory = {
  create: (overrides: Partial<TeamInsert> = {}): TeamInsert => ({
    id: generateId(),
    name: 'Test Team',
    organizationId: undefined,
    ...overrides,
  }),

  createMultiple: (count: number, overrides: Partial<TeamInsert> = {}): TeamInsert[] => {
    return Array.from({ length: count }, (_, i) =>
      teamFactory.create({
        ...overrides,
        name: overrides.name || `Team ${i + 1}`,
      })
    );
  },
};

export const userFactory = {
  create: (overrides: Partial<UserInsert> = {}): UserInsert => ({
    id: generateId(),
    name: 'Test User',
    email: `test${generateId()}@example.com`,
    avatarUrl: 'https://example.com/avatar.png',
    role: 'team_member',
    provider: 'github',
    providerId: `github_${generateId()}`,
    teamId: undefined,
    ...overrides,
  }),

  createAdmin: (overrides: Partial<UserInsert> = {}): UserInsert => {
    return userFactory.create({ role: 'admin', ...overrides });
  },

  createManager: (overrides: Partial<UserInsert> = {}): UserInsert => {
    return userFactory.create({ role: 'manager', ...overrides });
  },

  createMultiple: (count: number, overrides: Partial<UserInsert> = {}): UserInsert[] => {
    return Array.from({ length: count }, (_, i) =>
      userFactory.create({
        ...overrides,
        email: `test${generateId()}@example.com`,
      })
    );
  },
};

export const projectFactory = {
  create: (overrides: Partial<ProjectInsert> = {}): ProjectInsert => ({
    id: generateId(),
    name: 'Test Project',
    graphId: generateUuid(),
    graphMeta: JSON.stringify({ version: '1.0.0' }),
    teamId: undefined,
    createdBy: undefined,
    ...overrides,
  }),

  createMultiple: (count: number, overrides: Partial<ProjectInsert> = {}): ProjectInsert[] => {
    return Array.from({ length: count }, (_, i) =>
      projectFactory.create({
        ...overrides,
        name: overrides.name || `Project ${i + 1}`,
      })
    );
  },

  createWithGraph: (graphData: Record<string, unknown>, overrides: Partial<ProjectInsert> = {}): ProjectInsert => {
    return projectFactory.create({
      graphMeta: JSON.stringify(graphData),
      ...overrides,
    });
  },
};

export const generationJobFactory = {
  create: (overrides: Partial<GenerationJobInsert> = {}): GenerationJobInsert => ({
    id: generateId(),
    uuid: generateUuid() as any,
    graphId: generateUuid(),
    projectId: generateId(),
    requestedBy: generateId(),
    status: 'pending',
    config: JSON.stringify({ provider: 'claude', model: 'claude-3-5-sonnet' }),
    resultData: undefined,
    errorMessage: undefined,
    progress: 0,
    startedAt: undefined,
    completedAt: undefined,
    githubPrUrl: undefined,
    ...overrides,
  }),

  createPending: (overrides: Partial<GenerationJobInsert> = {}): GenerationJobInsert => {
    return generationJobFactory.create({ status: 'pending', progress: 0, ...overrides });
  },

  createRunning: (overrides: Partial<GenerationJobInsert> = {}): GenerationJobInsert => {
    return generationJobFactory.create({
      status: 'running',
      progress: 50,
      startedAt: new Date(),
      ...overrides,
    });
  },

  createCompleted: (overrides: Partial<GenerationJobInsert> = {}): GenerationJobInsert => {
    return generationJobFactory.create({
      status: 'completed',
      progress: 100,
      startedAt: new Date(Date.now() - 60000),
      completedAt: new Date(),
      resultData: JSON.stringify({
        artifacts: [{ name: 'test.yaml', content: 'apiVersion: v1' }],
      }),
      ...overrides,
    });
  },

  createFailed: (overrides: Partial<GenerationJobInsert> = {}): GenerationJobInsert => {
    return generationJobFactory.create({
      status: 'failed',
      progress: 50,
      errorMessage: 'LLM provider error: Rate limit exceeded',
      startedAt: new Date(Date.now() - 60000),
      ...overrides,
    });
  },

  createCancelled: (overrides: Partial<GenerationJobInsert> = {}): GenerationJobInsert => {
    return generationJobFactory.create({
      status: 'cancelled',
      progress: 25,
      ...overrides,
    });
  },
};

export const artifactFactory = {
  create: (overrides: Partial<GenerationJobArtifactInsert> = {}): GenerationJobArtifactInsert => ({
    id: generateId(),
    jobId: generateId(),
    type: 'file',
    name: 'deployment.yaml',
    content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-app`,
    storageUrl: undefined,
    size: 1024,
    checksum: generateUuid(),
    ...overrides,
  }),

  createMultiple: (count: number, overrides: Partial<GenerationJobArtifactInsert> = {}): GenerationJobArtifactInsert[] => {
    const types = ['deployment.yaml', 'service.yaml', 'configmap.yaml', 'ingress.yaml'];
    return Array.from({ length: count }, (_, i) =>
      artifactFactory.create({
        ...overrides,
        name: overrides.name || types[i % types.length],
        jobId: overrides.jobId || generateId(),
      })
    );
  },
};

export const operatorTokenFactory = {
  create: (overrides: Partial<OperatorTokenInsert> = {}): OperatorTokenInsert => ({
    id: generateId(),
    token: generateToken(),
    companyId: undefined,
    clusterId: undefined,
    label: 'Test Operator Token',
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    revokedAt: undefined,
    ...overrides,
  }),

  createExpired: (overrides: Partial<OperatorTokenInsert> = {}): OperatorTokenInsert => {
    return operatorTokenFactory.create({
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      ...overrides,
    });
  },

  createRevoked: (overrides: Partial<OperatorTokenInsert> = {}): OperatorTokenInsert => {
    return operatorTokenFactory.create({
      revokedAt: new Date(),
      ...overrides,
    });
  },
};

export const operatorFactory = {
  create: (overrides: Partial<OperatorInsert> = {}): OperatorInsert => ({
    id: generateId(),
    clusterId: `cluster-${generateUuid()}`,
    tokenId: generateId(),
    companyId: undefined,
    version: '1.0.0',
    mcpEndpoint: 'http://operator:8080',
    status: 'online',
    lastSeenAt: new Date(),
    registeredAt: new Date(),
    ...overrides,
  }),

  createOffline: (overrides: Partial<OperatorInsert> = {}): OperatorInsert => {
    return operatorFactory.create({
      status: 'offline',
      lastSeenAt: new Date(Date.now() - 60 * 60 * 1000),
      ...overrides,
    });
  },
};

export const sessionFactory = {
  create: (email: string, overrides: Partial<{ id: string; provider: string; expiresAt: Date }> = {}): {
    id: string;
    subject: string;
    provider: string;
    accessToken: string;
    expiresAt: Date;
  } => ({
    id: generateSessionId(),
    subject: email,
    provider: 'github',
    accessToken: `access_${generateToken()}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    ...overrides,
  }),

  createExpired: (email: string): ReturnType<typeof sessionFactory.create> => {
    return sessionFactory.create(email, {
      expiresAt: new Date(Date.now() - 60 * 60 * 1000),
    });
  },
};

export const graphFactory = {
  create: (overrides: Partial<{
    id: string;
    name: string;
    nodes: unknown[];
    edges: unknown[];
    metadata: Record<string, unknown>;
  }> = {}): {
    id: string;
    name: string;
    nodes: unknown[];
    edges: unknown[];
    metadata: Record<string, unknown>;
  } => ({
    id: generateUuid(),
    name: 'Test Graph',
    nodes: [],
    edges: [],
    metadata: { version: '1.0.0', createdBy: 'test' },
    ...overrides,
  }),

  createWithNodes: (nodeCount: number, overrides: Partial<{
    name: string;
    metadata: Record<string, unknown>;
  }> = {}): ReturnType<typeof graphFactory.create> => {
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: `node-${i + 1}`,
      type: 'deployment',
      data: { name: `Node ${i + 1}` },
      position: { x: i * 100, y: 0 },
    }));

    return graphFactory.create({
      ...overrides,
      nodes,
      metadata: { ...overrides.metadata, nodeCount },
    });
  },
};
