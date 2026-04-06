function GenerateKubernetesManifests(
  graph:        GraphContext,
  nodes:        NodeContext[],
  rag_context:  RAGContextInput,
  user_context: UserContextInput,
  k8s_version:  string
) -> ManifestsResponse {
  client KubegramFallback
  prompt #"
    You are an expert Kubernetes manifest generator. Your task is to generate
    production-ready Kubernetes YAML manifests based on the provided infrastructure graph.

    **Kubernetes Version:** {{ k8s_version }}
    **Default Namespace:** default

    **Core Principles:**
    1. Generate valid, production-ready Kubernetes YAML manifests
    2. Follow Kubernetes best practices and conventions
    3. Include proper resource management and security configurations
    4. Ensure manifests are syntactically correct and complete
    5. Use appropriate API versions for Kubernetes {{ k8s_version }}

    **Kubernetes Best Practices:**
    1. **API Versions:** Use appropriate API versions for {{ k8s_version }}
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

    **Graph Context:**
    - Graph Name: {{ graph.graph_name }}
    - Namespace: {{ graph.default_namespace }}
    - Total Nodes: {{ graph.total_nodes }}
    - Node Types: {{ graph.node_types }}

    {% if rag_context.context_text %}
    **Similar Infrastructure Examples (RAG Context):**
    {{ rag_context.context_text }}
    {% endif %}

    {% if user_context.system_messages|length > 0 %}
    **System Messages:**
    {% for msg in user_context.system_messages %}
    - {{ msg }}
    {% endfor %}

    {% endif %}
    {% if user_context.planning_context|length > 0 %}
    **Planning Context:**
    {% for msg in user_context.planning_context %}
    - {{ msg }}
    {% endfor %}

    {% endif %}
    {% if user_context.user_requirements|length > 0 %}
    **Additional Requirements:**
    {% for req in user_context.user_requirements %}
    - {{ req }}
    {% endfor %}

    {% endif %}
    **Infrastructure Components to Generate:**

    {% for node in nodes %}
    ---
    ### {{ node.node_type }}: {{ node.name }} (ID: {{ node.id }})
    **Namespace:** {{ node.k8s_namespace }}

    {% if node.node_type == "MICROSERVICE" %}
    **Type:** Microservice
    - Language: {{ node.language | default("unknown") }}
    - Framework: {{ node.framework | default("unknown") }}
    - Image: {{ node.container_image | default(node.name + ":latest") }}
    - Replicas: {{ node.replicas | default(1) }}
    {% if node.ports|length > 0 %}- Ports: {{ node.ports | join(", ") }}{% endif %}
    {% if node.env_vars %}- Environment Variables: {{ node.env_vars }}{% endif %}
    {% if node.secret_names|length > 0 %}- Secrets: {{ node.secret_names | join(", ") }}{% endif %}
    {% if node.resources %}- Resources: {{ node.resources }}{% endif %}
    **Generate:** Deployment, Service (ClusterIP), ConfigMap, Secret. Include readinessProbe, livenessProbe, non-root securityContext.

    {% elif node.node_type == "DATABASE" %}
    {% if node.is_external %}
    **Type:** External Database ({{ node.external_provider | default("Cloud") }})
    - Engine: {{ node.engine | default("postgresql") }}
    - Host: {{ node.external_host | default("EXTERNAL_DB_HOST") }}
    **Generate:** ConfigMap (connection params), Secret (credentials only — no StatefulSet/PVC).
    {% else %}
    **Type:** Database (in-cluster)
    - Engine: {{ node.engine | default("postgresql") }}, version {{ node.version | default("latest") }}
    - Storage: {{ node.storage_size | default("10Gi") }} / {{ node.storage_class | default("standard") }}
    - Replicas: {{ node.replicas | default(1) }}, Port: {{ node.ports[0] | default(5432) }}
    **Generate:** StatefulSet, PersistentVolumeClaim, Service (ClusterIP), ConfigMap, Secret.
    {% endif %}

    {% elif node.node_type == "CACHE" %}
    {% if node.is_external %}
    **Type:** External Cache ({{ node.external_provider | default("Cloud") }})
    - Engine: {{ node.engine | default("redis") }}, Host: {{ node.external_host | default("EXTERNAL_CACHE_HOST") }}
    **Generate:** ConfigMap (connection params), Secret — no Deployment/Service.
    {% else %}
    **Type:** Cache (in-cluster)
    - Engine: {{ node.engine | default("redis") }}, version {{ node.version | default("latest") }}
    - MaxMemory: {{ node.max_memory | default("2Gi") }}, Port: {{ node.ports[0] | default(6379) }}
    - ClusterMode: {{ node.cluster_mode | default(false) }}, Persistence: {{ node.persistence | default(false) }}
    **Generate:** Deployment, Service (ClusterIP), ConfigMap{% if node.persistence %}, PersistentVolumeClaim{% endif %}.
    {% endif %}

    {% elif node.node_type == "MESSAGE_QUEUE" %}
    **Type:** Message Queue
    - Engine: {{ node.engine | default("rabbitmq") }}, version {{ node.version | default("latest") }}
    - Replicas: {{ node.replicas | default(3) }}, Port: {{ node.ports[0] | default(5672) }}
    - ManagementPort: {{ node.management_port | default(15672) }}, Storage: {{ node.storage_size | default("5Gi") }}
    {% if node.partitions %}- Partitions: {{ node.partitions }}, ReplicationFactor: {{ node.replication_factor | default(1) }}{% endif %}
    **Generate:** StatefulSet, headless Service, management Service, PVC template, ConfigMap, Secret.

    {% elif node.node_type == "PROXY" %}
    {% if node.is_external %}
    **Type:** External Proxy — generate ConfigMap/Secret only.
    {% else %}
    **Type:** Proxy (in-cluster)
    - Kind: {{ node.kind | default("nginx") }}, Port: {{ node.ports[0] | default(80) }}
    - TLS: {{ node.tls_enabled | default(false) }}, RateLimit: {{ node.rate_limit_enabled | default(false) }}
    {% if node.upstreams|length > 0 %}- Upstreams: {{ node.upstreams | join(", ") }}{% endif %}
    **Generate:** Deployment, Service (LoadBalancer/NodePort), ConfigMap, Ingress{% if node.tls_enabled %}, TLS Secret{% endif %}.
    {% endif %}

    {% elif node.node_type == "LOAD_BALANCER" %}
    {% if node.is_external %}
    **Type:** External LB — generate Service (ExternalName) + ConfigMap.
    - DNS: {{ node.external_host | default("EXTERNAL_LB_DNS") }}
    {% else %}
    **Type:** Load Balancer (in-cluster)
    - Kind: {{ node.kind | default("haproxy") }}, Algorithm: {{ node.algorithm | default("roundrobin") }}
    - HealthCheck: {{ node.health_check_path | default("/health") }}
    {% if node.backends|length > 0 %}- Backends: {{ node.backends | join(", ") }}{% endif %}
    **Generate:** Deployment, Service (LoadBalancer type), ConfigMap.
    {% endif %}

    {% elif node.node_type == "MONITORING" %}
    **Type:** Monitoring
    - Kind: {{ node.kind | default("prometheus") }}, Port: {{ node.ports[0] | default(9090) }}
    - ScrapeInterval: {{ node.scrape_interval | default("30s") }}, Retention: {{ node.retention_period | default("15d") }}
    - Storage: {{ node.storage_size | default("50Gi") }}, Alertmanager: {{ node.alertmanager | default(false) }}
    **Generate:** StatefulSet/Deployment, Service, PersistentVolumeClaim, ConfigMap, ServiceMonitor CRDs if applicable.

    {% elif node.node_type == "GATEWAY" %}
    **Type:** API Gateway
    - Kind: {{ node.kind | default("kong") }}, Port: {{ node.ports[0] | default(8080) }}
    - TLS: {{ node.tls_enabled | default(false) }}, Auth: {{ node.auth_enabled | default(false) }}
    - CORS: {{ node.cors_enabled | default(false) }}, RateLimit: {{ node.rate_limit_enabled | default(false) }}
    {% if node.routes|length > 0 %}- Routes: {{ node.routes | join(", ") }}{% endif %}
    {% if node.domains|length > 0 %}- Domains: {{ node.domains | join(", ") }}{% endif %}
    **Generate:** Deployment, Service (LoadBalancer), ConfigMap, Ingress/Gateway API{% if node.tls_enabled %}, TLS Secret{% endif %}.

    {% else %}
    **Type:** Generic / {{ node.node_type }}
    {% if node.resources %}- Config: {{ node.resources }}{% endif %}
    **Generate:** Appropriate Kubernetes manifests with proper labels, security context, production-ready configuration.
    {% endif %}

    {% endfor %}

    {{ ctx.output_format }}
  "#
}
