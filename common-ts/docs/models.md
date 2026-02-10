# Model Categories

This document provides detailed information about the different model categories available in the library.

## 1. Kubernetes Resources (`src/models/kubernetes/`)

Core Kubernetes resources including:

- **Workloads**: Pods, Deployments, StatefulSets, Jobs
- **Services**: Services, Endpoints, Ingress
- **Storage**: PersistentVolumes, PersistentVolumeClaims
- **Configuration**: ConfigMaps, Secrets
- **Networking**: NetworkPolicies, Services

### Example Usage

```typescript
import { Service, Deployment, ConnectionType } from '@kubegram/common-ts';

const service: Service = {
  name: 'web-service',
  type: 'Service',
  namespace: 'default',
  apiVersion: 'v1',
  kind: 'Service',
  spec: {
    type: 'ClusterIP',
    ports: [{ port: 80, targetPort: 3000 }],
    selector: { app: 'web' }
  }
};

const deployment: Deployment = {
  name: 'web-deployment',
  type: 'Deployment',
  namespace: 'default',
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  spec: {
    replicas: 3,
    selector: { matchLabels: { app: 'web' } },
    template: {
      metadata: { labels: { app: 'web' } },
      spec: {
        containers: [{
          name: 'web',
          image: 'nginx:latest',
          ports: [{ containerPort: 3000 }]
        }]
      }
    }
  }
};
```

## 2. Service Mesh Resources (`src/models/service-mesh/`)

Common service mesh abstractions:

- **Traffic Management**: VirtualServices, TrafficSplits, LoadBalancers
- **Security**: AuthorizationRules, TLSConfigs
- **Observability**: ConnectionPools, OutlierDetection
- **Gateway**: GatewayServers, WorkloadEntries

## 3. Proxy Resources (`src/models/proxy/`)

Proxy server configurations:

- **Servers**: ProxyServer configurations
- **Upstreams**: ProxyUpstream definitions
- **Locations**: ProxyLocation routing rules
- **Security**: ProxySSL, ProxyAccessControl
- **Performance**: ProxyCache, ProxyRateLimit, ProxyCompression

### Example Usage

```typescript
import { ProxyGraphValidator } from '@kubegram/common-ts';

const nginxConfig = {
  name: 'api-gateway',
  type: 'NginxServer',
  server: {
    listen: 80,
    server_name: 'api.example.com',
    locations: [{
      path: '/api',
      proxy_pass: 'http://backend-service:3000'
    }]
  }
};

const validator = new ProxyGraphValidator(graph);
const validation = validator.validateNginxServer(nginxConfig);

if (validation.isValid) {
  console.log('Nginx configuration is valid');
} else {
  console.log('Issues found:', validation.errors);
}
```

## 4. Specific Implementations

### Istio (`src/models/istio/`)
- VirtualService, DestinationRule, Gateway
- Sidecar, EnvoyFilter, AuthorizationPolicy
- PeerAuthentication, RequestAuthentication

### Linkerd (`src/models/linkerd/`)
- ServiceProfile, TrafficSplit, AuthorizationPolicy
- Server, HTTPRoute, Gateway, GatewayClass

### Nginx (`src/models/nginx/`)
- NginxServer, NginxUpstream, NginxLocation
- Load balancing and caching configurations

### Traefik (`src/models/traefik/`)
- TraefikRouter, TraefikService, TraefikMiddleware
- TCP/UDP routing and TLS configurations

### HAProxy (`src/models/haproxy/`)
- HAProxyFrontend, HAProxyBackend, HAProxyListen
- Global and defaults configurations

## 5. GitOps/CD Resources (`src/models/cd/`)

Continuous Deployment tools:

- **ArgoCD**: ArgoCDApplication, ArgoCDProject, ArgoCDRepository, ArgoCDCluster
- **Flux**: FluxGitRepository, FluxKustomization, FluxHelmRelease, FluxSourceController

## 6. Validation System (`src/models/validation/`)

Comprehensive validation framework:

- **ConnectionValidator**: Validates resource connections and relationships
- **Connection Analysis**: Analyzes connection patterns and compatibility
- **Path Validation**: Validates complete connection paths

### Example Usage

```typescript
import { ConnectionValidator } from '@kubegram/common-ts';

const validator = new ConnectionValidator();

// Check if two resource types can connect
const canConnect = validator.canConnect('Service', 'Deployment');
console.log(`Can connect: ${canConnect}`);

// Get all possible connection types
const connections = validator.getConnectionTypesBetween('Service', 'Deployment');
connections.forEach(conn => {
  console.log(`Connection: ${conn.connectionType}`);
  console.log(`Description: ${conn.metadata.description}`);
});

// Get the best connection type
const bestConnection = validator.getBestConnectionType('Service', 'Deployment');
console.log(`Best connection: ${bestConnection}`);
```

## 7. Microservice Resources (`src/models/microservice.ts`)

Microservice abstraction over Kubernetes resources:

```typescript
import { Microservice } from '@kubegram/common-ts';

const microservice: Microservice = {
  name: 'user-api',
  type: 'Microservice',
  namespace: 'default',
  language: 'TypeScript',
  framework: 'Express',
  packageManager: 'npm',
  dependencies: ['express'],
  scripts: { start: 'node index.js' },
  environmentVariables: { PORT: '3000' },
  ports: [3000],
  volumes: [],
  networks: [],
  baseImage: 'node:18-alpine',
  image: 'user-api',
  version: '1.0.0'
};
```

## Architecture Diagrams

### High-Level Model Architecture

```mermaid
graph TB
    subgraph "Core Graph System"
        GR[GraphResource]
        CT[ConnectionType]
        G[Graph]
        N[Node]
        E[Edge]
    end
    
    subgraph "Kubernetes Models"
        K8S[Kubernetes Resources]
        POD[Pod]
        DEP[Deployment]
        SVC[Service]
        ING[Ingress]
        PV[PersistentVolume]
    end
    
    subgraph "Service Mesh Models"
        SM[Service Mesh]
        VS[VirtualService]
        GW[Gateway]
        SC[Sidecar]
        TS[TrafficSplit]
    end
    
    subgraph "Proxy Models"
        PROXY[Proxy]
        NGINX[Nginx]
        TRAEFIK[Traefik]
        HAPROXY[HAProxy]
    end
    
    subgraph "CD/GitOps Models"
        CD[CD Resources]
        ARGO[ArgoCD]
        FLUX[Flux]
    end
    
    subgraph "Validation System"
        VAL[Validation]
        CV[ConnectionValidator]
        CA[Connection Analysis]
    end
    
    GR --> K8S
    GR --> SM
    GR --> PROXY
    GR --> CD
    
    CT --> E
    E --> N
    N --> G
    
    VAL --> CV
    VAL --> CA
    CV --> G
```

### Resource Relationship Flow

```mermaid
graph LR
    subgraph "External Traffic"
        USER[User Request]
        LB[Load Balancer]
    end
    
    subgraph "Ingress Layer"
        ING[Ingress]
        GW[Gateway]
    end
    
    subgraph "Service Mesh Layer"
        VS[VirtualService]
        DR[DestinationRule]
        SC[Sidecar]
    end
    
    subgraph "Kubernetes Layer"
        SVC[Service]
        DEP[Deployment]
        POD[Pod]
    end
    
    subgraph "Storage Layer"
        PVC[PersistentVolumeClaim]
        PV[PersistentVolume]
    end
    
    subgraph "GitOps Layer"
        APP[ArgoCD Application]
        REPO[Git Repository]
    end
    
    USER --> LB
    LB --> ING
    LB --> GW
    ING --> SVC
    GW --> VS
    VS --> SVC
    SVC --> DEP
    DEP --> POD
    POD --> SC
    POD --> PVC
    PVC --> PV
    APP --> DEP
    APP --> SVC
    REPO --> APP
```

### Connection Type Categories

```mermaid
mindmap
  root((Connection Types))
    Hierarchical
      CONTAINS
      BELONGS_TO
    Network
      ROUTES_TO
      LOAD_BALANCES
      PROXIES
      INGRESS_TO
    Service Mesh
      MESH_CONNECTS
      MESH_AUTHORIZES
      MESH_SPLITS_TRAFFIC
      MESH_MIRRORS
    Storage
      MOUNTS
      CLAIMS
      BACKS_UP
    Security
      AUTHENTICATES
      AUTHORIZES
      ENCRYPTS
    Configuration
      CONFIGURES
      DEPENDS_ON
      REQUIRES
    Monitoring
      MONITORS
      LOGS_TO
      METRICS_TO
```

### Validation System Flow

```mermaid
flowchart TD
    START[Start Validation] --> INPUT[Input: Source & Target Types]
    INPUT --> CHECK{Can Connect?}
    CHECK -->|No| ERROR[Return Error]
    CHECK -->|Yes| GET[Get Connection Types]
    GET --> VALIDATE[Validate Connection Rules]
    VALIDATE --> CONDITIONS{Check Conditions}
    CONDITIONS -->|Fail| WARNING[Return Warning]
    CONDITIONS -->|Pass| SUCCESS[Return Success]
    ERROR --> END[End]
    WARNING --> END
    SUCCESS --> END
```
