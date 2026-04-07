// Output types — match the existing ManifestItem/ParsedManifest Zod schema exactly

class ManifestItem {
  file_name      string   @description("e.g. deployment.yaml, service.yaml")
  generated_code string   @description("complete YAML manifest content")
  assumptions    string[] @description("assumptions made during generation")
  decisions      string[] @description("design decisions made")
  commands       string[]? @description("optional kubectl or shell commands")
  entity_name    string   @description("Kubernetes resource name")
  entity_id      string?  @description("original node ID from the graph")
  entity_type    string?  @description("node type e.g. MICROSERVICE, DATABASE")
}

class ManifestsResponse {
  manifests ManifestItem[]
}

// Validation workflow types

class OpenApiPathEntry {
  path    string @description("The API path e.g. /api/v1/users")
  methods string @description("Comma-separated HTTP methods e.g. GET,POST,DELETE")
}

class ValidationTestCaseOutput {
  method         string @description("HTTP method: GET, POST, PUT, DELETE, PATCH")
  path           string @description("The exact path from the spec, no base URL")
  headers        map<string, string> @description("Content-Type, Accept headers, etc.")
  body           string? @description("JSON-encoded request body for POST/PUT/PATCH")
  expectedStatus int    @description("Most common success HTTP status for this operation")
}

class ValidationTestCasesResponse {
  testCases ValidationTestCaseOutput[]
}

// Validation analysis types

class TestCaseSummary {
  correlationId string
  method        string
  path          string
  expectedStatus int
}

class TestResultSummary {
  correlationId    string
  success          bool
  actualStatus     int
  responseTimeMs   int
  error           string?
}

class ValidationStats {
  total   int
  passed  int
  failed  int
  skipped int
}

class ValidationAnalysisResponse {
  analysisText string @description("Concise 3-5 sentence analysis of validation results")
}

// Input types used by prompt templates

class GraphContext {
  graph_name       string @description("name of the infrastructure graph")
  default_namespace string @description("default Kubernetes namespace")
  total_nodes      int    @description("total number of nodes in the graph")
  node_types       string @description("node type summary e.g. MICROSERVICE: 2, DATABASE: 1")
}

class RAGContextInput {
  context_text string? @description("similar graph examples retrieved from vector search")
}

class UserContextInput {
  system_messages   string[] @description("correction/retry messages from prior attempts")
  user_requirements string[] @description("feature requirements from the user")
  planning_context  string[] @description("architectural/planning intent from the user")
}

// Represents one graph node submitted for manifest generation.
// Replaces the pre-rendered node_prompt: string.
class NodeContext {
  id          string
  name        string
  node_type      string   @description("GraphNodeType enum value: MICROSERVICE, DATABASE, CACHE, etc.")
  k8s_namespace  string
  is_external    bool     @description("true when dependencyType is set — generate only ConfigMap/Secret")

  // Identity / workload
  language         string?
  framework        string?
  container_image  string?
  replicas    int?
  ports       int[]

  // Storage / stateful
  engine        string?
  version       string?
  storage_size  string?
  storage_class string?
  max_memory    string?
  persistence   bool?
  cluster_mode  bool?

  // Message queue
  partitions         int?
  replication_factor int?
  management_port    int?

  // Networking
  kind               string?
  algorithm          string?
  upstreams          string[]
  backends           string[]
  routes             string[]
  domains            string[]
  tls_enabled        bool?
  auth_enabled       bool?
  cors_enabled       bool?
  rate_limit_enabled bool?

  // Monitoring
  scrape_interval   string?
  retention_period  string?
  alertmanager      bool?
  health_check_path string?

  // External dependency
  external_host     string?
  external_provider string?

  // KV bags (JSON strings to avoid map<> edge cases)
  env_vars     string?  @description("JSON-encoded {key: value} environment variables")
  resources    string?  @description("JSON-encoded resource requests/limits")
  secret_names string[]
}
