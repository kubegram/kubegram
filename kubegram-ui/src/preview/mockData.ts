import type { User } from '@/store/slices/oauth/types';
import type { CanvasGraph, CanvasNode, CanvasArrow, Project } from '@/types/canvas';
import type { PlanResult } from '@/store/api/plan';
import type { CodegenResults } from '@/store/api/codegen';
import { GraphQL } from '@/lib/graphql-client';

// --- Mock User ---

export const MOCK_USER: User = {
  id: 'preview-user-1',
  name: 'Preview User',
  email: 'preview@kubegram.com',
  role: 'admin',
  provider: 'github',
  providerId: 'preview-github-123',
  avatarUrl: undefined,
};

// --- Dummy arrow node (required by CanvasArrow type) ---

const dummyArrowNode: CanvasNode = {
  id: 'arrow-node-dummy',
  type: 'arrow-node',
  label: '',
  name: '',
  iconSrc: '',
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  companyId: '',
  nodeType: GraphQL.GraphNodeType.Microservice,
  userId: '',
};

// ============================================================
// E-Commerce Microservices Architecture
// ============================================================
//
// Layout (top-to-bottom):
//
//   Row 1:  [Nginx LB]
//             ↓            ↓
//   Row 2:  [order-svc]  [cart-svc]
//             ↓            ↓
//   Row 3:  [order-deploy] [cart-deploy]
//             ↑    ↑         ↑    ↑
//   Row 4:  [cm] [secret]  [cm] [secret]
//
//   Row 5:  [ecommerce namespace]
// ============================================================

// --- Row 1: Nginx Load Balancer ---

const nginxLb: CanvasNode = {
  id: 'nginx-lb',
  type: 'LoadBalancer',
  label: 'nginx-lb',
  name: 'nginx-lb',
  iconSrc: '/kubernetes/resources/unlabeled/svc.svg',
  x: 400,
  y: 80,
  width: 100,
  height: 100,
  color: '#FF6D00',
  companyId: 'preview-company',
  nodeType: GraphQL.GraphNodeType.LoadBalancer,
  userId: 'preview-user-1',
};

// --- Row 2: Services ---

const orderSvc: CanvasNode = {
  id: 'order-svc',
  type: 'Service',
  label: 'order-svc',
  name: 'order-svc',
  iconSrc: '/kubernetes/resources/unlabeled/svc.svg',
  x: 200,
  y: 250,
  width: 100,
  height: 100,
  color: '#34A853',
  companyId: 'preview-company',
  nodeType: GraphQL.GraphNodeType.Service,
  userId: 'preview-user-1',
};

const cartSvc: CanvasNode = {
  id: 'cart-svc',
  type: 'Service',
  label: 'cart-svc',
  name: 'cart-svc',
  iconSrc: '/kubernetes/resources/unlabeled/svc.svg',
  x: 600,
  y: 250,
  width: 100,
  height: 100,
  color: '#34A853',
  companyId: 'preview-company',
  nodeType: GraphQL.GraphNodeType.Service,
  userId: 'preview-user-1',
};

// --- Row 3: Deployments ---

const orderDeploy: CanvasNode = {
  id: 'order-deploy',
  type: 'Deployment',
  label: 'order-deploy',
  name: 'order-deploy',
  iconSrc: '/kubernetes/resources/unlabeled/deploy.svg',
  x: 200,
  y: 420,
  width: 100,
  height: 100,
  color: '#4285F4',
  companyId: 'preview-company',
  nodeType: GraphQL.GraphNodeType.Deployment,
  userId: 'preview-user-1',
};

const cartDeploy: CanvasNode = {
  id: 'cart-deploy',
  type: 'Deployment',
  label: 'cart-deploy',
  name: 'cart-deploy',
  iconSrc: '/kubernetes/resources/unlabeled/deploy.svg',
  x: 600,
  y: 420,
  width: 100,
  height: 100,
  color: '#4285F4',
  companyId: 'preview-company',
  nodeType: GraphQL.GraphNodeType.Deployment,
  userId: 'preview-user-1',
};

// --- Row 4: ConfigMaps and Secrets ---

const orderConfig: CanvasNode = {
  id: 'order-config',
  type: 'ConfigMap',
  label: 'order-config',
  name: 'order-config',
  iconSrc: '/kubernetes/resources/unlabeled/cm.svg',
  x: 100,
  y: 590,
  width: 100,
  height: 100,
  color: '#EA4335',
  companyId: 'preview-company',
  nodeType: GraphQL.GraphNodeType.Configmap,
  userId: 'preview-user-1',
};

const orderSecret: CanvasNode = {
  id: 'order-secret',
  type: 'Secret',
  label: 'order-secrets',
  name: 'order-secrets',
  iconSrc: '/kubernetes/resources/unlabeled/secret.svg',
  x: 300,
  y: 590,
  width: 100,
  height: 100,
  color: '#9C27B0',
  companyId: 'preview-company',
  nodeType: GraphQL.GraphNodeType.Secret,
  userId: 'preview-user-1',
};

const cartConfig: CanvasNode = {
  id: 'cart-config',
  type: 'ConfigMap',
  label: 'cart-config',
  name: 'cart-config',
  iconSrc: '/kubernetes/resources/unlabeled/cm.svg',
  x: 500,
  y: 590,
  width: 100,
  height: 100,
  color: '#EA4335',
  companyId: 'preview-company',
  nodeType: GraphQL.GraphNodeType.Configmap,
  userId: 'preview-user-1',
};

const cartSecret: CanvasNode = {
  id: 'cart-secret',
  type: 'Secret',
  label: 'cart-secrets',
  name: 'cart-secrets',
  iconSrc: '/kubernetes/resources/unlabeled/secret.svg',
  x: 700,
  y: 590,
  width: 100,
  height: 100,
  color: '#9C27B0',
  companyId: 'preview-company',
  nodeType: GraphQL.GraphNodeType.Secret,
  userId: 'preview-user-1',
};

// --- Row 5: Namespace ---

const ecommerceNs: CanvasNode = {
  id: 'ecommerce-ns',
  type: 'Namespace',
  label: 'ecommerce',
  name: 'ecommerce',
  iconSrc: '/kubernetes/resources/unlabeled/ns.svg',
  x: 400,
  y: 750,
  width: 100,
  height: 100,
  color: '#607D8B',
  companyId: 'preview-company',
  nodeType: GraphQL.GraphNodeType.Namespace,
  userId: 'preview-user-1',
};

// --- All nodes ---

const allNodes: CanvasNode[] = [
  nginxLb,
  orderSvc,
  cartSvc,
  orderDeploy,
  cartDeploy,
  orderConfig,
  orderSecret,
  cartConfig,
  cartSecret,
  ecommerceNs,
];

// --- Arrows ---

const arrows: CanvasArrow[] = [
  // Nginx LB → Services
  {
    id: 'arrow-lb-order',
    startNodeId: 'nginx-lb',
    endNodeId: 'order-svc',
    startX: 400,
    startY: 180,
    endX: 250,
    endY: 250,
    node: dummyArrowNode,
    connectionType: GraphQL.ConnectionType.LoadBalances,
  },
  {
    id: 'arrow-lb-cart',
    startNodeId: 'nginx-lb',
    endNodeId: 'cart-svc',
    startX: 500,
    startY: 180,
    endX: 650,
    endY: 250,
    node: dummyArrowNode,
    connectionType: GraphQL.ConnectionType.LoadBalances,
  },
  // Services → Deployments
  {
    id: 'arrow-order-svc-deploy',
    startNodeId: 'order-svc',
    endNodeId: 'order-deploy',
    startX: 250,
    startY: 350,
    endX: 250,
    endY: 420,
    node: dummyArrowNode,
    connectionType: GraphQL.ConnectionType.ServiceExposesPod,
  },
  {
    id: 'arrow-cart-svc-deploy',
    startNodeId: 'cart-svc',
    endNodeId: 'cart-deploy',
    startX: 650,
    startY: 350,
    endX: 650,
    endY: 420,
    node: dummyArrowNode,
    connectionType: GraphQL.ConnectionType.ServiceExposesPod,
  },
  // ConfigMaps → Deployments
  {
    id: 'arrow-order-cm-deploy',
    startNodeId: 'order-config',
    endNodeId: 'order-deploy',
    startX: 150,
    startY: 590,
    endX: 220,
    endY: 520,
    node: dummyArrowNode,
    connectionType: GraphQL.ConnectionType.Configures,
  },
  {
    id: 'arrow-cart-cm-deploy',
    startNodeId: 'cart-config',
    endNodeId: 'cart-deploy',
    startX: 550,
    startY: 590,
    endX: 620,
    endY: 520,
    node: dummyArrowNode,
    connectionType: GraphQL.ConnectionType.Configures,
  },
  // Secrets → Deployments
  {
    id: 'arrow-order-secret-deploy',
    startNodeId: 'order-secret',
    endNodeId: 'order-deploy',
    startX: 350,
    startY: 590,
    endX: 280,
    endY: 520,
    node: dummyArrowNode,
    connectionType: GraphQL.ConnectionType.Mounts,
  },
  {
    id: 'arrow-cart-secret-deploy',
    startNodeId: 'cart-secret',
    endNodeId: 'cart-deploy',
    startX: 750,
    startY: 590,
    endX: 680,
    endY: 520,
    node: dummyArrowNode,
    connectionType: GraphQL.ConnectionType.Mounts,
  },
  // Namespace → order-deploy (represents namespace containment)
  {
    id: 'arrow-ns-order',
    startNodeId: 'ecommerce-ns',
    endNodeId: 'order-deploy',
    startX: 400,
    startY: 750,
    endX: 250,
    endY: 520,
    node: dummyArrowNode,
    connectionType: GraphQL.ConnectionType.Has,
  },
];

// --- Mock Canvas Graph ---

export const MOCK_CANVAS_GRAPH: CanvasGraph = {
  id: 'preview-graph-1',
  name: 'E-Commerce Platform',
  companyId: 'preview-company',
  userId: 'preview-user-1',
  graphType: GraphQL.GraphType.Kubernetes,
  nodes: allNodes,
  arrows,
};

// --- Mock Project ---

export const MOCK_PROJECT: Project = {
  id: 'preview-project-1',
  name: 'E-Commerce Platform',
  graph: MOCK_CANVAS_GRAPH,
};

// --- Mock Codegen Results ---

export const MOCK_CODEGEN_RESULTS: CodegenResults = {
  graphId: 'preview-graph-1',
  jobId: 'preview-job-1',
  timestamp: new Date().toISOString(),
  generatedCodes: [
    {
      nodeId: 'nginx-lb',
      code: `apiVersion: v1
kind: Service
metadata:
  name: nginx-lb
  namespace: ecommerce
  labels:
    app: nginx
    tier: frontend
spec:
  type: LoadBalancer
  selector:
    app: nginx
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 80
  externalTrafficPolicy: Local
  sessionAffinity: None`,
      language: 'yaml',
      metadata: { fileName: 'nginx-lb-service.yaml', path: '/k8s/networking/', name: 'nginx-lb', type: 'Service' },
    },
    {
      nodeId: 'order-svc',
      code: `apiVersion: v1
kind: Service
metadata:
  name: order-svc
  namespace: ecommerce
  labels:
    app: order-service
    tier: backend
spec:
  type: ClusterIP
  selector:
    app: order-service
  ports:
    - name: http
      protocol: TCP
      port: 3001
      targetPort: 3001`,
      language: 'yaml',
      metadata: { fileName: 'order-service.yaml', path: '/k8s/order/', name: 'order-svc', type: 'Service' },
    },
    {
      nodeId: 'cart-svc',
      code: `apiVersion: v1
kind: Service
metadata:
  name: cart-svc
  namespace: ecommerce
  labels:
    app: cart-service
    tier: backend
spec:
  type: ClusterIP
  selector:
    app: cart-service
  ports:
    - name: http
      protocol: TCP
      port: 3002
      targetPort: 3002`,
      language: 'yaml',
      metadata: { fileName: 'cart-service.yaml', path: '/k8s/cart/', name: 'cart-svc', type: 'Service' },
    },
    {
      nodeId: 'order-deploy',
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-deploy
  namespace: ecommerce
  labels:
    app: order-service
    tier: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
        tier: backend
    spec:
      containers:
        - name: order-service
          image: ecommerce/order-service:1.4.2
          ports:
            - containerPort: 3001
              name: http
          envFrom:
            - configMapRef:
                name: order-config
            - secretRef:
                name: order-secrets
          resources:
            requests:
              cpu: "200m"
              memory: "256Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"
          readinessProbe:
            httpGet:
              path: /healthz/ready
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /healthz/live
              port: 3001
            initialDelaySeconds: 15
            periodSeconds: 10`,
      language: 'yaml',
      metadata: { fileName: 'order-deployment.yaml', path: '/k8s/order/', name: 'order-deploy', type: 'Deployment' },
    },
    {
      nodeId: 'cart-deploy',
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: cart-deploy
  namespace: ecommerce
  labels:
    app: cart-service
    tier: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cart-service
  template:
    metadata:
      labels:
        app: cart-service
        tier: backend
    spec:
      containers:
        - name: cart-service
          image: ecommerce/cart-service:1.2.0
          ports:
            - containerPort: 3002
              name: http
          envFrom:
            - configMapRef:
                name: cart-config
            - secretRef:
                name: cart-secrets
          resources:
            requests:
              cpu: "150m"
              memory: "192Mi"
            limits:
              cpu: "750m"
              memory: "768Mi"
          readinessProbe:
            httpGet:
              path: /healthz/ready
              port: 3002
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /healthz/live
              port: 3002
            initialDelaySeconds: 15
            periodSeconds: 10`,
      language: 'yaml',
      metadata: { fileName: 'cart-deployment.yaml', path: '/k8s/cart/', name: 'cart-deploy', type: 'Deployment' },
    },
    {
      nodeId: 'order-config',
      code: `apiVersion: v1
kind: ConfigMap
metadata:
  name: order-config
  namespace: ecommerce
  labels:
    app: order-service
data:
  SERVICE_NAME: order-service
  SERVICE_PORT: "3001"
  DB_NAME: orders_db
  DB_PORT: "5432"
  REDIS_DB: "0"
  LOG_LEVEL: info
  CACHE_TTL: "300"
  PAYMENT_GATEWAY_TIMEOUT: "30000"
  INVENTORY_CHECK_ENABLED: "true"`,
      language: 'yaml',
      metadata: { fileName: 'order-configmap.yaml', path: '/k8s/order/', name: 'order-config', type: 'ConfigMap' },
    },
    {
      nodeId: 'order-secret',
      code: `apiVersion: v1
kind: Secret
metadata:
  name: order-secrets
  namespace: ecommerce
  labels:
    app: order-service
type: Opaque
stringData:
  DB_HOST: postgres-orders.ecommerce.svc.cluster.local
  DB_USER: order_svc
  DB_PASSWORD: "<REPLACE_WITH_SEALED_SECRET>"
  REDIS_URL: redis://redis.ecommerce.svc.cluster.local:6379/0
  PAYMENT_API_KEY: "<REPLACE_WITH_SEALED_SECRET>"
  JWT_SECRET: "<REPLACE_WITH_SEALED_SECRET>"`,
      language: 'yaml',
      metadata: { fileName: 'order-secret.yaml', path: '/k8s/order/', name: 'order-secrets', type: 'Secret' },
    },
    {
      nodeId: 'cart-config',
      code: `apiVersion: v1
kind: ConfigMap
metadata:
  name: cart-config
  namespace: ecommerce
  labels:
    app: cart-service
data:
  SERVICE_NAME: cart-service
  SERVICE_PORT: "3002"
  DB_NAME: carts_db
  DB_PORT: "5432"
  REDIS_DB: "1"
  LOG_LEVEL: info
  CACHE_TTL: "600"
  CART_EXPIRY_HOURS: "72"
  MAX_ITEMS_PER_CART: "50"`,
      language: 'yaml',
      metadata: { fileName: 'cart-configmap.yaml', path: '/k8s/cart/', name: 'cart-config', type: 'ConfigMap' },
    },
    {
      nodeId: 'cart-secret',
      code: `apiVersion: v1
kind: Secret
metadata:
  name: cart-secrets
  namespace: ecommerce
  labels:
    app: cart-service
type: Opaque
stringData:
  DB_HOST: postgres-carts.ecommerce.svc.cluster.local
  DB_USER: cart_svc
  DB_PASSWORD: "<REPLACE_WITH_SEALED_SECRET>"
  REDIS_URL: redis://redis.ecommerce.svc.cluster.local:6379/1
  SESSION_SECRET: "<REPLACE_WITH_SEALED_SECRET>"`,
      language: 'yaml',
      metadata: { fileName: 'cart-secret.yaml', path: '/k8s/cart/', name: 'cart-secrets', type: 'Secret' },
    },
    {
      nodeId: 'ecommerce-ns',
      code: `apiVersion: v1
kind: Namespace
metadata:
  name: ecommerce
  labels:
    app.kubernetes.io/part-of: ecommerce-platform
    environment: production
    team: platform-engineering`,
      language: 'yaml',
      metadata: { fileName: 'namespace.yaml', path: '/k8s/', name: 'ecommerce', type: 'Namespace' },
    },
  ],
  summary: {
    totalNodes: 10,
    successfulGenerations: 10,
    failedGenerations: 0,
  },
};

// ============================================================
// Plan: Adds HPA for both services + NetworkPolicy
// ============================================================

const orderHpa: CanvasNode = {
  id: 'order-hpa',
  type: 'HorizontalPodAutoscaler',
  label: 'order-hpa',
  name: 'order-hpa',
  iconSrc: '/kubernetes/resources/unlabeled/hpa.svg',
  x: 50,
  y: 420,
  width: 100,
  height: 100,
  color: '#FF9800',
  companyId: 'preview-company',
  nodeType: GraphQL.GraphNodeType.Horizontalpodautoscaler,
  userId: 'preview-user-1',
};

const cartHpa: CanvasNode = {
  id: 'cart-hpa',
  type: 'HorizontalPodAutoscaler',
  label: 'cart-hpa',
  name: 'cart-hpa',
  iconSrc: '/kubernetes/resources/unlabeled/hpa.svg',
  x: 850,
  y: 420,
  width: 100,
  height: 100,
  color: '#FF9800',
  companyId: 'preview-company',
  nodeType: GraphQL.GraphNodeType.Horizontalpodautoscaler,
  userId: 'preview-user-1',
};

const ecommerceNetpol: CanvasNode = {
  id: 'ecommerce-netpol',
  type: 'NetworkPolicy',
  label: 'ecommerce-netpol',
  name: 'ecommerce-netpol',
  iconSrc: '/kubernetes/resources/unlabeled/netpol.svg',
  x: 400,
  y: 420,
  width: 100,
  height: 100,
  color: '#00BCD4',
  companyId: 'preview-company',
  nodeType: GraphQL.GraphNodeType.Networkpolicy,
  userId: 'preview-user-1',
};

const planArrows: CanvasArrow[] = [
  ...arrows,
  {
    id: 'plan-arrow-order-hpa',
    startNodeId: 'order-hpa',
    endNodeId: 'order-deploy',
    startX: 100,
    startY: 470,
    endX: 200,
    endY: 470,
    node: dummyArrowNode,
    connectionType: GraphQL.ConnectionType.Scales,
  },
  {
    id: 'plan-arrow-cart-hpa',
    startNodeId: 'cart-hpa',
    endNodeId: 'cart-deploy',
    startX: 850,
    startY: 470,
    endX: 700,
    endY: 470,
    node: dummyArrowNode,
    connectionType: GraphQL.ConnectionType.Scales,
  },
  {
    id: 'plan-arrow-netpol-order',
    startNodeId: 'ecommerce-netpol',
    endNodeId: 'order-svc',
    startX: 450,
    startY: 420,
    endX: 250,
    endY: 350,
    node: dummyArrowNode,
    connectionType: GraphQL.ConnectionType.AllowsTraffic,
  },
  {
    id: 'plan-arrow-netpol-cart',
    startNodeId: 'ecommerce-netpol',
    endNodeId: 'cart-svc',
    startX: 450,
    startY: 420,
    endX: 650,
    endY: 350,
    node: dummyArrowNode,
    connectionType: GraphQL.ConnectionType.AllowsTraffic,
  },
];

const MOCK_PLAN_GRAPH: CanvasGraph = {
  id: 'preview-plan-graph-1',
  name: 'E-Commerce Platform (Production-Ready)',
  companyId: 'preview-company',
  userId: 'preview-user-1',
  graphType: GraphQL.GraphType.Kubernetes,
  nodes: [
    ...allNodes,
    orderHpa,
    cartHpa,
    ecommerceNetpol,
  ],
  arrows: planArrows,
};

export const MOCK_PLAN_RESULT: PlanResult = {
  graph: MOCK_PLAN_GRAPH,
  context: [
    'Added HorizontalPodAutoscaler (order-hpa) targeting order-deploy with min 2 / max 8 replicas, scaling on CPU utilization at 70%.',
    'Added HorizontalPodAutoscaler (cart-hpa) targeting cart-deploy with min 2 / max 6 replicas, scaling on CPU utilization at 70%. Lower max replicas because cart traffic is typically 40% of order traffic.',
    'Added NetworkPolicy (ecommerce-netpol) restricting ingress to order-svc and cart-svc to only accept traffic from the nginx-lb pod selector. All other ingress is denied by default.',
    'Assumption: The cluster has metrics-server installed and operational for HPA to function.',
    'Assumption: Both services expose CPU/memory metrics via their container resource usage.',
    'Assumption: The nginx-lb pods use the label app=nginx for NetworkPolicy pod selector matching.',
    'Recommendation: Add PodDisruptionBudgets for both deployments to ensure availability during node drains (minAvailable: 1 for cart, minAvailable: 2 for order).',
    'Recommendation: Consider adding ResourceQuota on the ecommerce namespace to cap total CPU at 8 cores and memory at 16Gi.',
    'Recommendation: Implement PodAntiAffinity rules to spread order-service pods across availability zones.',
  ],
};

// --- Mock Plan Markdown Spec ---

export const MOCK_PLAN_MARKDOWN = `# Infrastructure Plan: E-Commerce Platform

## Architecture Overview

This plan hardens the existing e-commerce Kubernetes deployment for production readiness
by adding autoscaling and network segmentation.

**Current topology:**
- **Nginx LoadBalancer** fronts two backend microservices
- **Order Service** (3 replicas) handles order processing, payment integration, and inventory checks
- **Cart Service** (2 replicas) manages shopping cart state with Redis-backed sessions
- Each service has dedicated ConfigMap and Secret resources
- All resources deployed in the \`ecommerce\` namespace

## Planned Changes

### New Resources

| Resource | Name | Target | Purpose |
|----------|------|--------|---------|
| HorizontalPodAutoscaler | \`order-hpa\` | order-deploy | Auto-scale order pods on CPU |
| HorizontalPodAutoscaler | \`cart-hpa\` | cart-deploy | Auto-scale cart pods on CPU |
| NetworkPolicy | \`ecommerce-netpol\` | order-svc, cart-svc | Restrict ingress to nginx only |

### Autoscaling Configuration

| Parameter | Order Service | Cart Service |
|-----------|--------------|--------------|
| Min Replicas | 2 | 2 |
| Max Replicas | 8 | 6 |
| Target CPU | 70% | 70% |
| Scale-down Stabilization | 300s | 300s |

**Rationale:** Order service has higher max replicas because order processing is CPU-intensive
(payment validation, inventory checks). Cart service traffic is typically 40% of order traffic
based on typical e-commerce conversion funnels.

### Network Policy

\`\`\`
Default: Deny all ingress to ecommerce namespace
Allow:   nginx-lb (app=nginx) → order-svc:3001
Allow:   nginx-lb (app=nginx) → cart-svc:3002
Allow:   order-svc → cart-svc:3002 (cross-service, cart lookup during checkout)
\`\`\`

## Assumptions

1. The cluster has \`metrics-server\` installed and operational
2. Both services report CPU/memory usage through standard container metrics
3. Nginx pods are labeled with \`app: nginx\` for NetworkPolicy selector matching
4. The services communicate over ClusterIP (no external egress required for inter-service calls)

## Recommendations

- Add \`PodDisruptionBudget\` for both deployments (\`minAvailable: 2\` for order, \`minAvailable: 1\` for cart)
- Implement \`ResourceQuota\` on the \`ecommerce\` namespace (cap: 8 CPU, 16Gi memory)
- Add \`PodAntiAffinity\` rules to spread pods across availability zones
- Consider \`VerticalPodAutoscaler\` in recommendation mode to right-size resource requests
`;

// --- Mock Context Data (team, org, company) ---

export const MOCK_TEAM = {
  id: 'preview-team-1',
  name: 'Preview Team',
};

export const MOCK_ORGANIZATION = {
  id: 'preview-org-1',
  name: 'Preview Organization',
};

export const MOCK_COMPANY = {
  id: 'preview-company',
  name: 'Preview Company',
};

// --- Mock LLM Configs ---

export const MOCK_LLM_CONFIGS = [
  { id: 'claude-sonnet', provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', displayName: 'Claude Sonnet 4.5' },
  { id: 'gpt-4o', provider: 'openai', model: 'gpt-4o', displayName: 'GPT-4o' },
  { id: 'gemini-pro', provider: 'google', model: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash' },
];
