/**
 * Node-specific prompt generators for Kubernetes resources
 * Port of app/agent/prompts/node_generators.py
 * Provides specialized prompts for each GraphNodeType
 */

import { GraphNodeType } from '../types/enums';
import { NodeInput } from '../types/graph';

// Prompt generator interface
export interface PromptGenerator {
  generatePrompt(node: NodeInput): string;
}

/**
 * Microservice prompt generator
 */
export class MicroservicePromptGenerator implements PromptGenerator {
  generatePrompt(node: NodeInput): string {
    const ms = node.microservice;
    const spec = node.spec || {};

    // Extract microservice details
    const language = ms?.language || spec.language || 'Unknown';
    const framework = ms?.framework || spec.framework || 'Unknown';
    const version = ms?.version || spec.version || '1.0.0';
    const image = ms?.image || spec.image || `${node.name}:latest`;
    const replicas = spec.replicas || 1;
    const ports = ms?.ports || spec.ports || [];
    const envVars = this.extractEnvVars(ms?.environmentVariables || spec.env || {});
    const secrets = this.extractSecrets(ms?.secrets || spec.secrets || {});
    const resources = spec.resources || {};

    let prompt = `Generate Kubernetes manifests for microservice: ${node.name}

**Microservice Details:**
- **Name:** ${node.name}
- **Type:** MICROSERVICE
- **Namespace:** ${node.namespace || 'default'}
- **Language:** ${language}
- **Framework:** ${framework}
- **Version:** ${version}
- **Image:** ${image}
- **Replicas:** ${replicas}
- **entity_name:** ${node.name}
- **entity_id:** ${node.id}
- **entity_type:** ${node.nodeType}
`;

    // Add ports
    if (ports.length > 0) {
      prompt += '\n**Ports:**\n';
      for (const port of ports) {
        prompt += `- ${port}\n`;
      }
    }

    // Add environment variables
    if (Object.keys(envVars).length > 0) {
      prompt += '\n**Environment Variables:**\n';
      for (const [key, value] of Object.entries(envVars)) {
        prompt += `- ${key}=${value}\n`;
      }
    }

    // Add secrets
    if (Object.keys(secrets).length > 0) {
      prompt += '\n**Secrets:**\n';
      for (const key of Object.keys(secrets)) {
        prompt += `- ${key}\n`;
      }
    }

    // Add resources
    if (Object.keys(resources).length > 0) {
      prompt += `\n**Resources:**\n${JSON.stringify(resources, null, 2)}\n`;
    }

    prompt += `
**Requirements:**
1. Generate Deployment manifest with the specified configuration
2. Generate Service manifest (ClusterIP type) exposing the ports
3. Generate ConfigMap for environment variables
4. Generate Secret for sensitive data
5. Include proper resource limits and requests
6. Configure health checks (readiness and liveness probes)
7. Add appropriate labels and annotations
8. Implement security best practices

**Output Format:**
Provide complete, production-ready Kubernetes YAML manifests.
`;

    return prompt;
  }

  private extractEnvVars(envVars: any[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const envVar of envVars) {
      if (envVar.name && envVar.value) {
        result[envVar.name] = envVar.value;
      }
    }
    return result;
  }

  private extractSecrets(secrets: any[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const secret of secrets) {
      if (secret.name) {
        result[secret.name] = '***'; // Don't log secret values
      }
    }
    return result;
  }
}

/**
 * Database prompt generator
 */
export class DatabasePromptGenerator implements PromptGenerator {
  generatePrompt(node: NodeInput): string {
    const db = node.database;
    const spec = node.spec || {};

    // Extract database details
    const engine = db?.engine || spec.engine || 'postgresql';
    const version = db?.version || spec.version || 'latest';
    const storageSize = db?.storageSize || spec.storage_size || '10Gi';
    const storageClass = db?.storageClass || spec.storage_class || 'standard';
    const replicas = db?.replicaCount || spec.replicas || 1;
    const port = db?.port || spec.port || 5432;
    const envVars = this.extractEnvVars(db?.environmentVariables || spec.env || {});
    const resources = spec.resources || {};

    // Check if this is an external dependency
    const isExternal = !!node.dependencyType;

    if (isExternal) {
      return this.generateExternalDatabasePrompt(node, engine, version, port, spec, envVars);
    }

    let prompt = `Generate Kubernetes manifests for database: ${node.name}

**Database Details:**
- **Name:** ${node.name}
- **Type:** DATABASE
- **Namespace:** ${node.namespace || 'default'}
- **Engine:** ${engine}
- **Version:** ${version}
- **Storage Size:** ${storageSize}
- **Storage Class:** ${storageClass}
- **Replicas:** ${replicas}
- **Port:** ${port}
- **entity_name:** ${node.name}
- **entity_id:** ${node.id}
- **entity_type:** ${node.nodeType}
`;

    // Add environment variables
    if (Object.keys(envVars).length > 0) {
      prompt += '\n**Environment Variables:**\n';
      for (const [key, value] of Object.entries(envVars)) {
        prompt += `- ${key}=${value}\n`;
      }
    }

    // Add resources
    if (Object.keys(resources).length > 0) {
      prompt += `\n**Resources:**\n${JSON.stringify(resources, null, 2)}\n`;
    }

    prompt += `
**Requirements:**
1. Generate StatefulSet for database with persistent storage
2. Generate PersistentVolumeClaim for storage
3. Generate Service (ClusterIP) for database access
4. Generate ConfigMap for database configuration
5. Generate Secret for database credentials
6. Include proper resource limits and requests
7. Configure health checks and readiness probes
8. Add appropriate labels and annotations
9. Implement security best practices (non-root user, etc.)

**Output Format:**
Provide complete, production-ready Kubernetes YAML manifests.
`;

    return prompt;
  }

  private generateExternalDatabasePrompt(
    node: NodeInput,
    engine: string,
    version: string,
    port: number,
    spec: any,
    envVars: Record<string, string>
  ): string {
    const cloudHost = spec.host || spec.endpoint || spec.url || 'EXTERNAL_DB_HOST';
    const cloudProvider = spec.provider || 'Cloud Provider';
    const connectionString = spec.connection_string || '';
    const sslEnabled = spec.ssl_enabled !== false;
    const sslMode = spec.ssl_mode || 'require';
    const databaseName = spec.database || spec.db_name || 'DATABASE_NAME';

    let prompt = `Generate Kubernetes manifests for EXTERNAL database dependency: ${node.name}

**External Database Details:**
- **Name:** ${node.name}
- **Type:** EXTERNAL DATABASE DEPENDENCY
- **Namespace:** ${node.namespace || 'default'}
- **Engine:** ${engine}
- **Version:** ${version}
- **Port:** ${port}
- **Dependency Type:** ${node.dependencyType}
- **Cloud Provider:** ${cloudProvider}
- **Host/Endpoint:** ${cloudHost}
- **Database Name:** ${databaseName}
- **SSL Enabled:** ${sslEnabled}
- **SSL Mode:** ${sslMode}
- **entity_name:** ${node.name}
- **entity_id:** ${node.id}
- **entity_type:** ${node.nodeType}

**Note:** This is an external database that is NOT managed by Kubernetes. 
This is typically a cloud-managed database service (e.g., AWS RDS, Google Cloud SQL, Azure Database).
We need to create configuration to access this external resource.
`;

    // Add connection configuration
    if (connectionString) {
      prompt += `\n**Connection String:** [PROTECTED]\n`;
    }

    if (Object.keys(envVars).length > 0) {
      prompt += '\n**Connection Configuration (from environment variables):**\n';
      for (const [key, value] of Object.entries(envVars)) {
        prompt += `- ${key}=${value}\n`;
      }
    }

    prompt += `
**Requirements:**
1. Generate ConfigMap with database connection parameters
2. Generate Secret for database credentials and sensitive data
3. DO NOT generate StatefulSet or PersistentVolume (database is external)
4. Include connection string or connection parameters
5. Configure SSL/TLS settings if applicable
6. Add appropriate labels and annotations
7. Implement security best practices

**Output Format:**
Provide complete Kubernetes YAML manifests for external database access.
`;

    return prompt;
  }

  private extractEnvVars(envVars: any[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const envVar of envVars) {
      if (envVar.name && envVar.value) {
        result[envVar.name] = envVar.value;
      }
    }
    return result;
  }
}

/**
 * Cache prompt generator
 */
export class CachePromptGenerator implements PromptGenerator {
  generatePrompt(node: NodeInput): string {
    const cache = node.cache;
    const spec = node.spec || {};

    // Extract cache details
    const engine = cache?.engine || spec.engine || 'redis';
    const version = cache?.version || spec.version || 'latest';
    const maxMemory = cache?.maxMemory || spec.max_memory || '2Gi';
    const replicas = cache?.replicaCount || spec.replicas || 1;
    const port = cache?.port || spec.port || 6379;
    const clusterMode = cache?.clusterMode || spec.cluster_mode || false;
    const persistenceEnabled = cache?.persistenceEnabled || spec.persistence_enabled || false;

    // Check if this is an external dependency
    const isExternal = !!node.dependencyType;

    if (isExternal) {
      return this.generateExternalCachePrompt(node, engine, version, port, spec);
    }

    let prompt = `Generate Kubernetes manifests for cache: ${node.name}

**Cache Details:**
- **Name:** ${node.name}
- **Type:** CACHE
- **Namespace:** ${node.namespace || 'default'}
- **Engine:** ${engine}
- **Version:** ${version}
- **Max Memory:** ${maxMemory}
- **Replicas:** ${replicas}
- **Port:** ${port}
- **Cluster Mode:** ${clusterMode}
- **Persistence Enabled:** ${persistenceEnabled}
- **entity_name:** ${node.name}
- **entity_id:** ${node.id}
- **entity_type:** ${node.nodeType}
`;

    prompt += `
**Requirements:**
1. Generate Deployment for cache with appropriate configuration
2. Generate Service (ClusterIP) for cache access
3. Generate ConfigMap for cache configuration
4. Generate PersistentVolumeClaim if persistence is enabled
5. Configure memory limits and requests appropriately
6. Add health checks and readiness probes
7. Include cluster configuration if cluster mode is enabled
8. Add appropriate labels and annotations
9. Implement security best practices

**Output Format:**
Provide complete, production-ready Kubernetes YAML manifests.
`;

    return prompt;
  }

  private generateExternalCachePrompt(
    node: NodeInput,
    engine: string,
    version: string,
    port: number,
    spec: any
  ): string {
    const cloudHost = spec.host || spec.endpoint || spec.url || 'EXTERNAL_CACHE_HOST';
    const cloudProvider = spec.provider || 'Cloud Provider';

    let prompt = `Generate Kubernetes manifests for EXTERNAL cache dependency: ${node.name}

**External Cache Details:**
- **Name:** ${node.name}
- **Type:** EXTERNAL CACHE DEPENDENCY
- **Namespace:** ${node.namespace || 'default'}
- **Engine:** ${engine}
- **Version:** ${version}
- **Port:** ${port}
- **Dependency Type:** ${node.dependencyType}
- **Cloud Provider:** ${cloudProvider}
- **Host/Endpoint:** ${cloudHost}
- **entity_name:** ${node.name}
- **entity_id:** ${node.id}
- **entity_type:** ${node.nodeType}

**Note:** This is an external cache service that is NOT managed by Kubernetes.
This is typically a cloud-managed cache service (e.g., AWS ElastiCache, Google Memorystore).
We need to create configuration to access this external resource.
`;

    prompt += `
**Requirements:**
1. Generate ConfigMap with cache connection parameters
2. Generate Secret for cache credentials and sensitive data
3. DO NOT generate Deployment or Service (cache is external)
4. Include connection parameters (host, port, etc.)
5. Add appropriate labels and annotations
6. Implement security best practices

**Output Format:**
Provide complete Kubernetes YAML manifests for external cache access.
`;

    return prompt;
  }
}

/**
 * Message Queue prompt generator
 */
export class MessageQueuePromptGenerator implements PromptGenerator {
  generatePrompt(node: NodeInput): string {
    const mq = node.messageQueue;
    const spec = node.spec || {};

    const engine = mq?.engine || spec.engine || 'rabbitmq';
    const version = mq?.version || spec.version || 'latest';
    const replicas = mq?.replicaCount || spec.replicas || 3;
    const port = mq?.port || spec.port || 5672;
    const managementPort = spec.management_port || 15672;
    const storageSize = spec.storage_size || '5Gi';
    const resources = spec.resources || {};

    let prompt = `Generate Kubernetes manifests for message queue: ${node.name}

**Message Queue Details:**
- **Name:** ${node.name}
- **Type:** MESSAGE_QUEUE
- **Namespace:** ${node.namespace || 'default'}
- **Engine:** ${engine}
- **Version:** ${version}
- **Replicas:** ${replicas}
- **Port:** ${port}
- **Management Port:** ${managementPort}
- **Storage Size:** ${storageSize}
- **entity_name:** ${node.name}
- **entity_id:** ${node.id}
- **entity_type:** ${node.nodeType}
`;

    if (Object.keys(resources).length > 0) {
      prompt += `\n**Resources:**\n${JSON.stringify(resources, null, 2)}\n`;
    }

    prompt += `
**Requirements:**
1. Generate StatefulSet manifest for the message queue
2. Generate headless Service for StatefulSet
3. Generate Service for management interface
4. Generate PersistentVolumeClaim template
5. Generate ConfigMap for queue configuration
6. Generate Secret for credentials
7. Include proper resource limits and requests
8. Configure health checks and readiness probes
9. Implement clustering for high availability
10. Add appropriate labels and annotations

**Output Format:**
Provide complete, production-ready Kubernetes YAML manifests.
`;

    return prompt;
  }
}

/**
 * Proxy prompt generator
 */
export class ProxyPromptGenerator implements PromptGenerator {
  generatePrompt(node: NodeInput): string {
    const proxy = node.proxy;
    const spec = node.spec || {};

    const kind = proxy?.kind || spec.kind || 'nginx';
    const version = proxy?.version || spec.version || 'latest';
    const port = proxy?.port || spec.port || 80;
    const sslPort = spec.ssl_port || 443;
    const upstreams = proxy?.upstreams || spec.upstreams || [];
    const tlsEnabled = proxy?.tlsEnabled || spec.tlsEnabled || false;
    const rateLimitEnabled = proxy?.rateLimitEnabled || spec.rateLimitEnabled || false;
    const resources = spec.resources || {};

    const isExternal = !!node.dependencyType;

    if (isExternal) {
      return this.generateExternalProxyPrompt(node, kind, version, port, spec);
    }

    let prompt = `Generate Kubernetes manifests for proxy: ${node.name}

**Proxy Details:**
- **Name:** ${node.name}
- **Type:** PROXY
- **Namespace:** ${node.namespace || 'default'}
- **Kind:** ${kind}
- **Version:** ${version}
- **Port:** ${port}
- **SSL Port:** ${sslPort}
- **TLS Enabled:** ${tlsEnabled}
- **Rate Limiting:** ${rateLimitEnabled}
- **entity_name:** ${node.name}
- **entity_id:** ${node.id}
- **entity_type:** ${node.nodeType}
`;

    if (upstreams.length > 0) {
      prompt += '\n**Upstreams:**\n';
      for (const upstream of upstreams) {
        prompt += `- ${upstream}\n`;
      }
    }

    if (Object.keys(resources).length > 0) {
      prompt += `\n**Resources:**\n${JSON.stringify(resources, null, 2)}\n`;
    }

    prompt += `
**Requirements:**
1. Generate Deployment manifest for the proxy
2. Generate Service manifest (LoadBalancer or NodePort type)
3. Generate ConfigMap for proxy configuration
4. Generate Ingress if applicable
5. Generate TLS Secret if TLS is enabled
6. Include proper resource limits and requests
7. Configure health checks (readiness and liveness probes)
8. Add appropriate labels and annotations
9. Implement rate limiting if enabled
10. Configure upstream routing

**Output Format:**
Provide complete, production-ready Kubernetes YAML manifests.
`;

    return prompt;
  }

  private generateExternalProxyPrompt(
    node: NodeInput,
    kind: string,
    version: string,
    port: number,
    spec: any
  ): string {
    const cloudHost = spec.host || spec.endpoint || spec.url || 'EXTERNAL_PROXY_HOST';
    const cloudProvider = spec.provider || 'Cloud Provider';
    const tlsEnabled = spec.tls_enabled !== false;

    let prompt = `Generate Kubernetes manifests for EXTERNAL proxy dependency: ${node.name}

**External Proxy Details:**
- **Name:** ${node.name}
- **Type:** EXTERNAL PROXY DEPENDENCY
- **Namespace:** ${node.namespace || 'default'}
- **Kind:** ${kind}
- **Version:** ${version}
- **Port:** ${port}
- **Dependency Type:** ${node.dependencyType}
- **Cloud Provider:** ${cloudProvider}
- **Host/Endpoint:** ${cloudHost}
- **TLS Enabled:** ${tlsEnabled}
- **entity_name:** ${node.name}
- **entity_id:** ${node.id}
- **entity_type:** ${node.nodeType}

**Note:** This is an external proxy that is NOT managed by Kubernetes.
We need to create configuration to access this external resource.
`;

    prompt += `
**Requirements:**
1. Generate ConfigMap with proxy connection details
2. Generate Secret for proxy credentials
3. DO NOT generate Deployment, Service, or Ingress (proxy is external)
4. Add appropriate labels and annotations
5. Implement security best practices

**Output Format:**
Provide complete Kubernetes YAML manifests for ConfigMap and Secret only.
`;

    return prompt;
  }
}

/**
 * Load Balancer prompt generator
 */
export class LoadBalancerPromptGenerator implements PromptGenerator {
  generatePrompt(node: NodeInput): string {
    const lb = node.loadBalancer;
    const spec = node.spec || {};

    const kind = lb?.kind || spec.kind || 'haproxy';
    const version = lb?.version || spec.version || 'latest';
    const algorithm = lb?.algorithm || spec.algorithm || 'roundrobin';
    const backends = lb?.backends || spec.backends || [];
    const healthCheckEnabled = lb?.healthCheckEnabled ?? spec.healthCheckEnabled ?? true;
    const healthCheckPath = lb?.healthCheckPath || spec.healthCheckPath || '/health';
    const resources = spec.resources || {};

    const isExternal = !!node.dependencyType;

    if (isExternal) {
      return this.generateExternalLoadBalancerPrompt(node, kind, version, spec);
    }

    let prompt = `Generate Kubernetes manifests for load balancer: ${node.name}

**Load Balancer Details:**
- **Name:** ${node.name}
- **Type:** LOAD_BALANCER
- **Namespace:** ${node.namespace || 'default'}
- **Kind:** ${kind}
- **Version:** ${version}
- **Algorithm:** ${algorithm}
- **Health Check Enabled:** ${healthCheckEnabled}
- **Health Check Path:** ${healthCheckPath}
- **entity_name:** ${node.name}
- **entity_id:** ${node.id}
- **entity_type:** ${node.nodeType}
`;

    if (backends.length > 0) {
      prompt += '\n**Backends:**\n';
      for (const backend of backends) {
        prompt += `- ${backend}\n`;
      }
    }

    if (Object.keys(resources).length > 0) {
      prompt += `\n**Resources:**\n${JSON.stringify(resources, null, 2)}\n`;
    }

    prompt += `
**Requirements:**
1. Generate Deployment manifest for the load balancer
2. Generate Service manifest (LoadBalancer type)
3. Generate ConfigMap for load balancer configuration
4. Include proper resource limits and requests
5. Configure health checks for backends
6. Add appropriate labels and annotations
7. Implement session affinity if needed
8. Configure SSL termination if applicable

**Output Format:**
Provide complete, production-ready Kubernetes YAML manifests.
`;

    return prompt;
  }

  private generateExternalLoadBalancerPrompt(
    node: NodeInput,
    kind: string,
    version: string,
    spec: any
  ): string {
    const cloudDns = spec.dns_name || spec.hostname || spec.url || 'EXTERNAL_LB_DNS';
    const cloudProvider = spec.provider || 'Cloud Provider';
    const scheme = spec.scheme || 'internet-facing';

    let prompt = `Generate Kubernetes manifests for EXTERNAL load balancer dependency: ${node.name}

**External Load Balancer Details:**
- **Name:** ${node.name}
- **Type:** EXTERNAL LOAD BALANCER DEPENDENCY
- **Namespace:** ${node.namespace || 'default'}
- **Kind:** ${kind}
- **Version:** ${version}
- **Dependency Type:** ${node.dependencyType}
- **Cloud Provider:** ${cloudProvider}
- **DNS Name:** ${cloudDns}
- **Scheme:** ${scheme}
- **entity_name:** ${node.name}
- **entity_id:** ${node.id}
- **entity_type:** ${node.nodeType}

**Note:** This is an external load balancer that is NOT managed by Kubernetes.
We need to create configuration to reference this external resource.
`;

    prompt += `
**Requirements:**
1. Generate Service of type ExternalName pointing to ${cloudDns}
2. Generate ConfigMap with load balancer details
3. DO NOT generate Deployment or Service (LoadBalancer type) as this is external
4. Add appropriate labels and annotations

**Output Format:**
Provide complete Kubernetes YAML manifests for Service (ExternalName) and ConfigMap only.
`;

    return prompt;
  }
}

/**
 * Monitoring prompt generator
 */
export class MonitoringPromptGenerator implements PromptGenerator {
  generatePrompt(node: NodeInput): string {
    const mon = node.monitoring;
    const spec = node.spec || {};

    const kind = mon?.kind || spec.kind || 'prometheus';
    const version = mon?.version || spec.version || 'latest';
    const port = mon?.port || spec.port || 9090;
    const scrapeInterval = mon?.scrapeInterval || spec.scrape_interval || '30s';
    const retentionPeriod = mon?.retentionPeriod || spec.retention_period || '15d';
    const storageSize = mon?.storageSize || spec.storage_size || '50Gi';
    const alertmanagerEnabled = mon?.alertmanagerEnabled ?? spec.alertmanager_enabled ?? false;
    const resources = spec.resources || {};

    let prompt = `Generate Kubernetes manifests for monitoring: ${node.name}

**Monitoring Details:**
- **Name:** ${node.name}
- **Type:** MONITORING
- **Namespace:** ${node.namespace || 'default'}
- **Kind:** ${kind}
- **Version:** ${version}
- **Port:** ${port}
- **Scrape Interval:** ${scrapeInterval}
- **Retention Period:** ${retentionPeriod}
- **Storage Size:** ${storageSize}
- **Alertmanager Enabled:** ${alertmanagerEnabled}
- **entity_name:** ${node.name}
- **entity_id:** ${node.id}
- **entity_type:** ${node.nodeType}
`;

    if (Object.keys(resources).length > 0) {
      prompt += `\n**Resources:**\n${JSON.stringify(resources, null, 2)}\n`;
    }

    prompt += `
**Requirements:**
1. Generate StatefulSet or Deployment for monitoring server
2. Generate Service for monitoring access
3. Generate PersistentVolumeClaim for data storage
4. Generate ConfigMap for monitoring configuration
5. Generate ServiceMonitor CRDs if applicable
6. Include proper resource limits and requests
7. Configure health checks and readiness probes
8. Add appropriate labels and annotations
9. Implement security best practices

**Output Format:**
Provide complete, production-ready Kubernetes YAML manifests.
`;

    return prompt;
  }
}

/**
 * Gateway prompt generator
 */
export class GatewayPromptGenerator implements PromptGenerator {
  generatePrompt(node: NodeInput): string {
    const gw = node.gateway;
    const spec = node.spec || {};

    const kind = gw?.kind || spec.kind || 'kong';
    const version = gw?.version || spec.version || 'latest';
    const port = gw?.port || spec.port || 8080;
    const routes = gw?.routes || spec.routes || [];
    const domains = gw?.domains || spec.domains || [];
    const tlsEnabled = gw?.tlsEnabled || spec.tls_enabled || false;
    const authEnabled = gw?.authEnabled || spec.auth_enabled || false;
    const corsEnabled = gw?.corsEnabled || spec.cors_enabled || false;
    const rateLimitEnabled = gw?.rateLimitEnabled || spec.rate_limit_enabled || false;
    const resources = spec.resources || {};

    let prompt = `Generate Kubernetes manifests for API gateway: ${node.name}

**Gateway Details:**
- **Name:** ${node.name}
- **Type:** GATEWAY
- **Namespace:** ${node.namespace || 'default'}
- **Kind:** ${kind}
- **Version:** ${version}
- **Port:** ${port}
- **TLS Enabled:** ${tlsEnabled}
- **Auth Enabled:** ${authEnabled}
- **CORS Enabled:** ${corsEnabled}
- **Rate Limiting:** ${rateLimitEnabled}
- **entity_name:** ${node.name}
- **entity_id:** ${node.id}
- **entity_type:** ${node.nodeType}
`;

    if (routes.length > 0) {
      prompt += '\n**Routes:**\n';
      for (const route of routes) {
        prompt += `- ${route}\n`;
      }
    }

    if (domains.length > 0) {
      prompt += '\n**Domains:**\n';
      for (const domain of domains) {
        prompt += `- ${domain}\n`;
      }
    }

    if (Object.keys(resources).length > 0) {
      prompt += `\n**Resources:**\n${JSON.stringify(resources, null, 2)}\n`;
    }

    prompt += `
**Requirements:**
1. Generate Deployment manifest for the gateway
2. Generate Service manifest (LoadBalancer type)
3. Generate ConfigMap for gateway configuration
4. Generate Ingress or Gateway API resources
5. Generate TLS Secret if TLS is enabled
6. Configure authentication if enabled
7. Configure CORS if enabled
8. Configure rate limiting if enabled
9. Include proper resource limits and requests
10. Configure health checks (readiness and liveness probes)
11. Add appropriate labels and annotations

**Output Format:**
Provide complete, production-ready Kubernetes YAML manifests.
`;

    return prompt;
  }
}

/**
 * Generic prompt generator for unsupported node types
 */
export class GenericPromptGenerator implements PromptGenerator {
  generatePrompt(node: NodeInput): string {
    const spec = node.spec || {};

    let prompt = `Generate Kubernetes manifests for resource: ${node.name}

**Resource Details:**
- **Name:** ${node.name}
- **Type:** ${node.nodeType}
- **Namespace:** ${node.namespace || 'default'}
- **entity_name:** ${node.name}
- **entity_id:** ${node.id}
- **entity_type:** ${node.nodeType}
`;

    // Add spec details if available
    if (Object.keys(spec).length > 0) {
      prompt += `\n**Configuration:**\n${JSON.stringify(spec, null, 2)}\n`;
    }

    prompt += `
**Requirements:**
1. Generate appropriate Kubernetes manifests for this resource type
2. Include necessary configuration from the spec
3. Add proper labels and annotations
4. Implement security best practices
5. Ensure manifests are production-ready

**Output Format:**
Provide complete, production-ready Kubernetes YAML manifests.
`;

    return prompt;
  }
}

/**
 * Prompt generator factory
 */
export class PromptGeneratorFactory {
  private static generators: Map<GraphNodeType, PromptGenerator> = new Map([
    [GraphNodeType.MICROSERVICE, new MicroservicePromptGenerator()],
    [GraphNodeType.DATABASE, new DatabasePromptGenerator()],
    [GraphNodeType.CACHE, new CachePromptGenerator()],
    [GraphNodeType.MESSAGE_QUEUE, new MessageQueuePromptGenerator()],
    [GraphNodeType.PROXY, new ProxyPromptGenerator()],
    [GraphNodeType.LOAD_BALANCER, new LoadBalancerPromptGenerator()],
    [GraphNodeType.MONITORING, new MonitoringPromptGenerator()],
    [GraphNodeType.GATEWAY, new GatewayPromptGenerator()],
  ]);

  private static genericGenerator = new GenericPromptGenerator();

  /**
   * Get prompt generator for node type
   */
  static getGenerator(nodeType: GraphNodeType): PromptGenerator {
    const generator = this.generators.get(nodeType);
    return generator || this.genericGenerator;
  }

  /**
   * Generate prompt for node
   */
  static generatePrompt(node: NodeInput): string {
    const generator = this.getGenerator(node.nodeType as GraphNodeType);
    return generator.generatePrompt(node);
  }
}

// Export convenience functions
export function generateNodePrompt(node: NodeInput): string {
  return PromptGeneratorFactory.generatePrompt(node);
}

export function getPromptGenerator(nodeType: GraphNodeType): PromptGenerator {
  return PromptGeneratorFactory.getGenerator(nodeType);
}