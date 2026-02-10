/**
 * System prompt builder for LLM code generation
 * Port of system prompt builder from app/workflows/codegen_workflow.py llm_call() node
 * Combines K8s best practices with RAG context
 */

import { Graph, GraphNode } from '../types/graph';
import { RAGContext } from '../rag/context';

// System prompt configuration interface
export interface SystemPromptConfig {
  includeRAGContext?: boolean;
  includeBestPractices?: boolean;
  includeSecurityGuidelines?: boolean;
  includeResourceLimits?: boolean;
  customInstructions?: string;
  userContext?: string[];
}

/**
 * System prompt builder class
 */
export class SystemPromptBuilder {
  private static readonly K8S_VERSION = '1.29';
  private static readonly DEFAULT_NAMESPACE = 'default';

  /**
   * Build comprehensive system prompt for Kubernetes manifest generation
   */
  static buildSystemPrompt(
    graph: Graph,
    ragContext?: RAGContext,
    config: SystemPromptConfig = {}
  ): string {
    const {
      includeRAGContext = true,
      includeBestPractices = true,
      includeSecurityGuidelines = true,
      includeResourceLimits = true,
      customInstructions = '',
      userContext,
    } = config;

    let prompt = `You are an expert Kubernetes manifest generator. Your task is to generate production-ready Kubernetes YAML manifests based on the provided infrastructure graph.

**Kubernetes Version:** ${this.K8S_VERSION}
**Default Namespace:** ${this.DEFAULT_NAMESPACE}

**Core Principles:**
1. Generate valid, production-ready Kubernetes YAML manifests
2. Follow Kubernetes best practices and conventions
3. Include proper resource management and security configurations
4. Ensure manifests are syntactically correct and complete
5. Use appropriate API versions for Kubernetes ${this.K8S_VERSION}
`;

    // Add best practices section
    if (includeBestPractices) {
      prompt += this.buildBestPracticesSection();
    }

    // Add security guidelines
    if (includeSecurityGuidelines) {
      prompt += this.buildSecuritySection();
    }

    // Add resource limits guidelines
    if (includeResourceLimits) {
      prompt += this.buildResourceLimitsSection();
    }

    // Add RAG context if available
    if (includeRAGContext && ragContext && ragContext.contextText) {
      prompt += ragContext.contextText;
    }

    // Add user context if available
    if (userContext && userContext.length > 0) {
      const processedContext = this.processUserContext(userContext);
      
      // Add system messages (for retries, corrections)
      if (processedContext.systemMessages.length > 0) {
        prompt += `\n**System Messages:**\n`;
        for (const msg of processedContext.systemMessages) {
          prompt += `- ${msg}\n`;
        }
        prompt += '\n';
      }
      
      // Add planning context
      if (processedContext.planningContext.length > 0) {
        prompt += `\n**Planning Context:**\n`;
        for (const msg of processedContext.planningContext) {
          prompt += `- ${msg}\n`;
        }
        prompt += '\n';
      }
    }

    // Add graph-specific context
    prompt += this.buildGraphContext(graph);

    // Add custom instructions
    if (customInstructions) {
      prompt += `\n**Custom Instructions:**\n${customInstructions}\n`;
    }

    // Add output format requirements
    prompt += this.buildOutputFormatSection();

    return prompt;
  }

  /**
   * Build best practices section
   */
  private static buildBestPracticesSection(): string {
    return `

**Kubernetes Best Practices:**
1. **API Versions:** Use appropriate API versions for ${this.K8S_VERSION}
   - apps/v1 for Deployments, StatefulSets, DaemonSets
   - v1 for Services, ConfigMaps, Secrets, PersistentVolumeClaims
   - networking.k8s.io/v1 for Ingress, NetworkPolicy
   - policy/v1 for PodDisruptionBudget, ResourceQuota
   - autoscaling/v2 for HorizontalPodAutoscaler

2. **Labels and Annotations:**
   - Always include 'app' and 'version' labels
   - Use 'kubernetes.io/managed-by: kustomize' for managed resources
   - Include 'company.com/owner: <owner>' and 'company.com/project: <project>'
   - Add 'company.com/environment: <env>' (dev/staging/prod)

3. **Resource Management:**
   - Always specify resource requests and limits
   - Use realistic values based on application requirements
   - Set appropriate memory and CPU limits
   - Include quality of service classes when needed

4. **Health Checks:**
   - Always include readinessProbe and livenessProbe for Deployments
   - Use appropriate paths and timeouts
   - Configure initialDelaySeconds based on application startup time

5. **Security Context:**
   - Run containers as non-root user when possible
   - Set readOnlyRootFilesystem: true for stateless applications
   - Use securityContext with proper capabilities

6. **Networking:**
   - Use ClusterIP Services for internal communication
   - Use NodePort or LoadBalancer only when explicitly required
   - Configure proper port names and protocols
`;
  }

  /**
   * Build security section
   */
  private static buildSecuritySection(): string {
    return `
**Security Guidelines:**
1. **Container Security:**
   - Use specific image tags (avoid 'latest' in production)
   - Run as non-root user (runAsUser: 1000)
   - Set readOnlyRootFilesystem: true when possible
   - Drop unnecessary capabilities (drop: ["ALL"])
   - Add only required capabilities

2. **Pod Security:**
   - Use securityContext at pod and container level
   - Configure seccompProfile when supported
   - Use AppArmor/SELinux profiles when available

3. **Network Security:**
   - Use NetworkPolicy to restrict traffic
   - Apply principle of least privilege
   - Use TLS for external communications

4. **Secrets Management:**
   - Never store sensitive data in ConfigMaps
   - Use Secrets for passwords, tokens, certificates
   - Consider using external secret management (Vault, AWS Secrets Manager)

5. **RBAC:**
   - Create ServiceAccounts with minimal permissions
   - Use Role and RoleBinding for access control
   - Avoid cluster-wide permissions when possible
`;
  }

  /**
   * Build resource limits section
   */
  private static buildResourceLimitsSection(): string {
    return `
**Resource Limits Guidelines:**
1. **CPU Requests:**
   - Microservices: 100m - 500m
   - Databases: 500m - 2000m
   - Caches: 250m - 1000m
   - Gateways/Proxies: 200m - 1000m

2. **Memory Requests:**
   - Microservices: 128Mi - 512Mi
   - Databases: 1Gi - 8Gi
   - Caches: 256Mi - 2Gi
   - Gateways/Proxies: 256Mi - 1Gi

3. **Resource Limits:**
   - Set limits higher than requests (typically 2x)
   - Don't set limits equal to requests (allows bursting)
   - Consider Quality of Service classes for critical applications

4. **Storage:**
   - Use appropriate storage classes (ssd, hdd)
   - Set realistic storage sizes
   - Include storage resource requests when using volumes
`;
  }

  /**
   * Build graph-specific context
   */
  private static buildGraphContext(graph: Graph): string {
    let context = `

**Graph Context:**
- **Graph Name:** ${graph.name}
- **Graph Type:** ${graph.graphType}
- **Company ID:** ${graph.companyId}
- **User ID:** ${graph.userId}
- **Total Nodes:** ${graph.nodes?.length || 0}
`;

    // Add node type summary
    if (graph.nodes && graph.nodes.length > 0) {
      const nodeTypeCount: Record<string, number> = {};
      
      for (const node of graph.nodes) {
        const nodeType = node.nodeType || 'Unknown';
        nodeTypeCount[nodeType] = (nodeTypeCount[nodeType] || 0) + 1;
      }

      context += '\n**Node Types:**\n';
      for (const [nodeType, count] of Object.entries(nodeTypeCount)) {
        context += `- ${nodeType}: ${count}\n`;
      }
    }

    // Add namespace information
    const namespaces = new Set<string>();
    if (graph.nodes) {
      for (const node of graph.nodes) {
        if (node.namespace) {
          namespaces.add(node.namespace);
        }
      }
    }

    if (namespaces.size > 0) {
      context += `\n**Namespaces:** ${Array.from(namespaces).join(', ')}\n`;
    }

    return context;
  }

  /**
   * Build output format section
   */
  private static buildOutputFormatSection(): string {
    return `
**Output Format Requirements:**
1. **JSON Structure:** Return a JSON object with a 'manifests' array
2. **Manifest Format:** Each manifest should include:
   - file_name: string (e.g., "deployment.yaml", "service.yaml")
   - generated_code: string (complete YAML manifest)
   - assumptions: array of strings (assumptions made)
   - decisions: array of strings (decisions made)
   - entity_name: string (resource name)
   - entity_id: string (resource ID)
   - entity_type: string (resource type)

3. **YAML Requirements:**
   - Use proper indentation (2 spaces)
   - Include metadata.name and metadata.namespace
   - Use kind and apiVersion correctly
   - Separate multiple resources with '---'
   - Ensure YAML is valid and parseable

4. **File Organization:**
   - Group related resources in single files when appropriate
   - Use descriptive file names
   - Include comments for complex configurations

**Example Output Structure:**
{
  "manifests": [
    {
      "file_name": "deployment.yaml",
      "generated_code": "apiVersion: apps/v1\\nkind: Deployment\\nmetadata:\\n  name: my-app\\n  namespace: default\\n...",
      "assumptions": ["Application is stateless", "No external dependencies"],
      "decisions": ["Used RollingUpdate strategy", "Set resource limits"],
      "entity_name": "my-app",
      "entity_id": "node-123",
      "entity_type": "MICROSERVICE"
    }
  ]
}

Generate complete, production-ready Kubernetes manifests following all the guidelines above.
`;
  }

  /**
   * Build minimal system prompt for simple use cases
   */
  static buildMinimalPrompt(): string {
    return `You are an expert Kubernetes manifest generator. Generate production-ready Kubernetes YAML manifests following best practices for version ${this.K8S_VERSION}.

Include proper resource limits, health checks, security contexts, and appropriate labels/annotations.

Return your response as a JSON object with a 'manifests' array, where each manifest includes:
- file_name: string
- generated_code: string (complete YAML)
- assumptions: array
- decisions: array
- entity_name: string
- entity_id: string  
- entity_type: string
`;
  }

  /**
   * Build prompt for specific node type
   */
  static buildNodeSpecificPrompt(
    node: GraphNode,
    ragContext?: RAGContext
  ): string {
    let prompt = this.buildMinimalPrompt();

    prompt += `

**Specific Requirements:**
- **Resource Type:** ${node.nodeType}
- **Resource Name:** ${node.name}
- **Namespace:** ${node.namespace || this.DEFAULT_NAMESPACE}
`;

    // Add RAG context if available
    if (ragContext && ragContext.contextText) {
      prompt += ragContext.contextText;
    }

    return prompt;
  }

  /**
   * Process user context messages into categorized groups
   */
  static processUserContext(context: string[]): {
    systemMessages: string[];
    userRequirements: string[];
    planningContext: string[];
  } {
    const result = {
      systemMessages: [] as string[],
      userRequirements: [] as string[],
      planningContext: [] as string[],
    };
    
    for (const message of context) {
      const lowerMessage = message.toLowerCase();
      
      // Simple heuristics for categorization
      if (lowerMessage.includes('system:') || 
          lowerMessage.includes('retry:') ||
          lowerMessage.includes('error:') ||
          lowerMessage.includes('fix:') ||
          lowerMessage.includes('correction:')) {
        result.systemMessages.push(message);
      } else if (lowerMessage.includes('plan:') ||
                 lowerMessage.includes('strategy:') ||
                 lowerMessage.includes('approach:') ||
                 lowerMessage.includes('architecture:')) {
        result.planningContext.push(message);
      } else {
        result.userRequirements.push(message);
      }
    }
    
    return result;
  }
}

// Export convenience functions
export function buildSystemPrompt(
  graph: Graph,
  ragContext?: RAGContext,
  config?: SystemPromptConfig
): string {
  return SystemPromptBuilder.buildSystemPrompt(graph, ragContext, config);
}

export function buildMinimalPrompt(): string {
  return SystemPromptBuilder.buildMinimalPrompt();
}

export function buildNodeSpecificPrompt(
  node: GraphNode,
  ragContext?: RAGContext
): string {
  return SystemPromptBuilder.buildNodeSpecificPrompt(node, ragContext);
}