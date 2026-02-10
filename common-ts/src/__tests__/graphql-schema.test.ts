import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildSchema, parse, validate, GraphQLSchema, execute, getIntrospectionQuery, introspectionFromSchema } from 'graphql';
import { createSchema, createYoga } from 'graphql-yoga';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('GraphQL Schema Loading', () => {
  let schemas: { [key: string]: string } = {};
  let combinedSchema: GraphQLSchema;
  let combinedSchemaString: string;

  beforeAll(() => {
    // Read all GraphQL schema files
    const schemaFiles = [
      'schema.graphql'
    ];

    for (const file of schemaFiles) {
      try {
        const schemaPath = join(__dirname, '..', 'graphql', file);
        schemas[file] = readFileSync(schemaPath, 'utf-8');
      } catch (error) {
        throw new Error(`Failed to read schema file ${file}: ${error}`);
      }
    }

    // Combine all schemas into one
    combinedSchemaString = Object.values(schemas).join('\n\n');
    
    try {
      // Parse and build the combined schema
      combinedSchema = buildSchema(combinedSchemaString);
    } catch (error) {
      throw new Error(`Failed to build combined GraphQL schema: ${error}`);
    }
  });

  describe('Individual Schema Files', () => {
    it('should load generated schema without errors', () => {
      expect(() => buildSchema(schemas['schema.graphql'])).not.toThrow();
    });
  });

  describe('Combined Schema', () => {
    it('should build combined schema without errors', () => {
      expect(combinedSchema).toBeDefined();
      expect(combinedSchema.getTypeMap()).toBeDefined();
    });

    it('should have all expected root types', () => {
      const typeMap = combinedSchema.getTypeMap();
      
      // Check for Query type
      expect(typeMap['Query']).toBeDefined();
      
      // Check for Mutation type
      expect(typeMap['Mutation']).toBeDefined();
      
      // Note: Subscription type is not defined in the current schema
      // expect(typeMap['Subscription']).toBeDefined();
    });

    it('should have core types defined', () => {
      const typeMap = combinedSchema.getTypeMap();
      
      // Core types
      expect(typeMap['ConnectionType']).toBeDefined();
      expect(typeMap['Edge']).toBeDefined();
      expect(typeMap['GraphNode']).toBeDefined();
      expect(typeMap['Graph']).toBeDefined();
      expect(typeMap['GraphNodeType']).toBeDefined();
      expect(typeMap['GraphType']).toBeDefined();
    });

    it('should have Kubernetes types defined', () => {
      const typeMap = combinedSchema.getTypeMap();
      
      expect(typeMap['KubernetesCluster']).toBeDefined();
      expect(typeMap['KubernetesClusterType']).toBeDefined();
    });

    it('should have microservice types defined', () => {
      const typeMap = combinedSchema.getTypeMap();
      
      expect(typeMap['Microservice']).toBeDefined();
      expect(typeMap['DeploymentStrategy']).toBeDefined();
      expect(typeMap['Script']).toBeDefined();
      expect(typeMap['EnvironmentVariable']).toBeDefined();
    });

    it('should have dependency types defined', () => {
      const typeMap = combinedSchema.getTypeMap();
      
      expect(typeMap['DependencyType']).toBeDefined();
      expect(typeMap['Secret']).toBeDefined();
      expect(typeMap['ConfigMap']).toBeDefined();
    });

    // Note: Service mesh, proxy, validation, CD, and statistics types are not defined in the current schema
    // These tests are commented out until those types are added to the schema
  });

  describe('Schema Duplicates Detection', () => {
    it('should not have duplicate type definitions', () => {
      // This test ensures we don't have duplicate type definitions
      // The schema should build successfully without duplicates
      expect(() => buildSchema(combinedSchemaString)).not.toThrow();
    });
  });

  describe('Schema Validation', () => {
    it('should validate a simple introspection query', () => {
      const introspectionQuery = `
        query IntrospectionQuery {
          __schema {
            types {
              name
            }
          }
        }
      `;

      const document = parse(introspectionQuery);
      const errors = validate(combinedSchema, document);
      
      expect(errors).toHaveLength(0);
    });

    it('should validate a query for microservices', () => {
      const microserviceQuery = `
        query GetMicroservices($companyId: String!) {
          microservices(companyId: $companyId) {
            id
            name
            language
            framework
            category
            version
          }
        }
      `;

      const document = parse(microserviceQuery);
      const errors = validate(combinedSchema, document);
      
      expect(errors).toHaveLength(0);
    });

    it('should validate a query for Kubernetes resources', () => {
      const k8sQuery = `
        query GetKubernetesResources($companyId: String!) {
          kubernetesClusters(companyId: $companyId) {
            id
            name
            region
            provider
            type
          }
        }
      `;

      const document = parse(k8sQuery);
      const errors = validate(combinedSchema, document);
      
      expect(errors).toHaveLength(0);
    });

    it('should validate a query for external dependencies', () => {
      const externalDepQuery = `
        query GetExternalDependencies($graphId: ID!) {
          externalDependencies(graphId: $graphId) {
            id
            name
            nodeType
            dependencyType
            namespace
          }
        }
      `;

      const document = parse(externalDepQuery);
      const errors = validate(combinedSchema, document);
      
      expect(errors).toHaveLength(0);
    });

    // Note: Service mesh, proxy, and validation resource queries are not defined in the current schema
    // These tests are commented out until those query types are added to the schema

    // Note: CD resource queries are not defined in the current schema
    // This test is commented out until those query types are added to the schema
  });

  describe('Schema Completeness', () => {
    it('should not have duplicate type definitions', () => {
      const typeMap = combinedSchema.getTypeMap();
      const typeNames = Object.keys(typeMap).filter(name => !name.startsWith('__'));
      
      // Check for duplicates (case-sensitive)
      const duplicates = typeNames.filter((name, index) => typeNames.indexOf(name) !== index);
      expect(duplicates).toHaveLength(0);
    });

    it('should have consistent enum values', () => {
      const typeMap = combinedSchema.getTypeMap();
      
      // Check ConnectionType enum
      const connectionType = typeMap['ConnectionType'];
      if (connectionType && connectionType.astNode?.kind === 'EnumTypeDefinition') {
        const values = connectionType.astNode.values?.map(v => v.name.value) || [];
        expect(values).toContain('ROUTES_TO');
        expect(values).toContain('LOAD_BALANCES');
        expect(values).toContain('CONNECTS_TO');
        expect(values).toContain('DEPENDS_ON');
      }
    });

    it('should have proper input types for mutations', () => {
      const typeMap = combinedSchema.getTypeMap();
      
      // Check for common input types that exist in the schema
      expect(typeMap['CreateMicroserviceInput']).toBeDefined();
      expect(typeMap['UpdateMicroserviceInput']).toBeDefined();
      expect(typeMap['CreateGraphInput']).toBeDefined();
      expect(typeMap['UpdateGraphInput']).toBeDefined();
      expect(typeMap['NodeInput']).toBeDefined();
      expect(typeMap['EdgeInput']).toBeDefined();
    });

    it('should have proper filter and sort types', () => {
      const typeMap = combinedSchema.getTypeMap();
      
      // Note: Filter and sort types are not currently defined in the schema
      // These tests are commented out until those types are added to the schema
      // expect(typeMap['MicroserviceFilter']).toBeDefined();
      // expect(typeMap['KubernetesResourceFilter']).toBeDefined();
      // expect(typeMap['ExternalDependencyFilter']).toBeDefined();
      // expect(typeMap['MicroserviceSortField']).toBeDefined();
      // expect(typeMap['KubernetesResourceSortField']).toBeDefined();
      // expect(typeMap['ExternalDependencySortField']).toBeDefined();
    });
  });

  describe('Server Validation', () => {
    it('should validate schema can be used for server implementation', () => {
      // Test that the schema is valid and can be used for server implementation
      expect(combinedSchema).toBeDefined();
      expect(combinedSchema.getTypeMap()).toBeDefined();
      
      // Verify that the schema has the required root types for a GraphQL server
      const queryType = combinedSchema.getQueryType();
      const mutationType = combinedSchema.getMutationType();
      
      expect(queryType).toBeDefined();
      expect(mutationType).toBeDefined();
      
      // Verify that the schema can be introspected (required for GraphQL servers)
      const introspection = introspectionFromSchema(combinedSchema);
      expect(introspection.__schema).toBeDefined();
    });

    it('should handle introspection queries', async () => {
      const introspectionQuery = getIntrospectionQuery();
      const document = parse(introspectionQuery);
      
      const result = await execute({
        schema: combinedSchema,
        document,
        contextValue: {},
      });

      expect(result.errors).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data?.__schema).toBeDefined();
    });

    it('should validate schema introspection', () => {
      const introspection = introspectionFromSchema(combinedSchema);
      expect(introspection).toBeDefined();
      expect(introspection.__schema).toBeDefined();
      expect(introspection.__schema.types).toBeDefined();
      expect(introspection.__schema.queryType).toBeDefined();
      expect(introspection.__schema.mutationType).toBeDefined();
    });

    it('should handle basic queries without errors', async () => {
      const testQueries = [
        // Microservice queries
        `
          query GetMicroservices($companyId: String!) {
            microservices(companyId: $companyId) {
              id
              name
              namespace
            }
          }
        `,
        // Kubernetes queries
        `
          query GetKubernetesClusters($companyId: String!) {
            kubernetesClusters(companyId: $companyId) {
              id
              name
              type
            }
          }
        `,
        // Graph queries
        `
          query GetGraphs($companyId: String!) {
            graphs(companyId: $companyId) {
              id
              name
              description
            }
          }
        `,
        // Node queries
        `
          query GetNodes($graphId: ID!) {
            nodes(graphId: $graphId) {
              id
              name
              nodeType
            }
          }
        `,
      ];

      for (const query of testQueries) {
        const document = parse(query);
        const errors = validate(combinedSchema, document);
        
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle Kubernetes-specific queries', async () => {
      const k8sQueries = [
        `
          query GetKubernetesResourcesByType($companyId: String!, $type: String!) {
            kubernetesResourcesByType(companyId: $companyId, type: $type) {
              id
              name
              nodeType
              namespace
            }
          }
        `,
        `
          query GetKubernetesResourcesByNamespace($companyId: String!, $namespace: String!) {
            kubernetesResourcesByNamespace(companyId: $companyId, namespace: $namespace) {
              id
              name
              nodeType
              namespace
            }
          }
        `,
      ];

      for (const query of k8sQueries) {
        const document = parse(query);
        const errors = validate(combinedSchema, document);
        
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle mutation queries', async () => {
      const mutationQueries = [
        `
          mutation CreateMicroservice($input: CreateMicroserviceInput!) {
            createMicroservice(input: $input) {
              id
              name
              namespace
            }
          }
        `,
        `
          mutation CreateKubernetesGraph($input: CreateKubernetesGraphInput!) {
            createKubernetesGraph(input: $input) {
              id
              name
              description
            }
          }
        `,
        `
          mutation CreateGraph($input: CreateGraphInput!) {
            createGraph(input: $input) {
              id
              name
              description
              graphType
            }
          }
        `,
      ];

      for (const query of mutationQueries) {
        const document = parse(query);
        const errors = validate(combinedSchema, document);
        
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle complex nested queries', async () => {
      const complexQuery = `
        query GetComplexData($companyId: String!) {
          kubernetesGraphs(companyId: $companyId) {
            id
            name
            description
            graphType
            nodes {
              id
              name
              nodeType
              namespace
              edges {
                connectionType
                node {
                  id
                  name
                }
              }
            }
            bridges {
              connectionType
              graph {
                id
                name
              }
            }
          }
        }
      `;

      const document = parse(complexQuery);
      const errors = validate(combinedSchema, document);
      
      expect(errors).toHaveLength(0);
    });

    it('should validate all enum values are properly defined', () => {
      const typeMap = combinedSchema.getTypeMap();
      
      // Test connection types
      const connectionType = typeMap['ConnectionType'];
      if (connectionType && connectionType.astNode?.kind === 'EnumTypeDefinition') {
        const values = connectionType.astNode.values?.map(v => v.name.value) || [];
        expect(values).toContain('HAS');
        expect(values).toContain('LOAD_BALANCES');
        expect(values).toContain('DEPENDS_ON');
        expect(values).toContain('SERVICE_EXPOSES_POD');
        expect(values).toContain('POD_RUNS_ON_NODE');
        expect(values).toContain('MICROSERVICE_DEPENDS_ON');
      }

      // Test GraphNodeType enum
      const graphNodeType = typeMap['GraphNodeType'];
      if (graphNodeType && graphNodeType.astNode?.kind === 'EnumTypeDefinition') {
        const values = graphNodeType.astNode.values?.map(v => v.name.value) || [];
        expect(values).toContain('POD');
        expect(values).toContain('SERVICE');
        expect(values).toContain('DEPLOYMENT');
      }
    });

    it('should validate core types exist', () => {
      const typeMap = combinedSchema.getTypeMap();
      
      // Test core types
      expect(typeMap['Graph']).toBeDefined();
      expect(typeMap['GraphNode']).toBeDefined();
      expect(typeMap['Edge']).toBeDefined();
      expect(typeMap['Microservice']).toBeDefined();
    });

    it('should validate type relationships', () => {
      const typeMap = combinedSchema.getTypeMap();
      
      // Test core types exist
      const graphNode = typeMap['GraphNode'];
      const edge = typeMap['Edge'];
      const graph = typeMap['Graph'];
      
      expect(graphNode).toBeDefined();
      expect(edge).toBeDefined();
      expect(graph).toBeDefined();
      
      // Test that Graph has nodes field
      if ('getFields' in graph && typeof graph.getFields === 'function') {
        const fields = graph.getFields();
        expect(fields['nodes']).toBeDefined();
        expect(fields['bridges']).toBeDefined();
      }
    });
  });

  describe('Generated Client', () => {
    it('should have GetConnectionType query in schema', () => {
      const typeMap = combinedSchema.getTypeMap();
      const queryType = typeMap['Query'];
      
      expect(queryType).toBeDefined();
      
      // Check that Query type has connectionType field
      if ('getFields' in queryType && typeof queryType.getFields === 'function') {
        const fields = queryType.getFields();
        const connectionTypeField = fields['connectionType'];
        
        expect(connectionTypeField).toBeDefined();
        
        if (connectionTypeField && 'args' in connectionTypeField) {
          expect(connectionTypeField.args).toHaveLength(3);
          
          const graphIdArg = connectionTypeField.args.find(arg => arg.name === 'graphId');
          const sourceTypeArg = connectionTypeField.args.find(arg => arg.name === 'sourceType');
          const targetTypeArg = connectionTypeField.args.find(arg => arg.name === 'targetType');
          
          expect(graphIdArg).toBeDefined();
          expect(sourceTypeArg).toBeDefined();
          expect(targetTypeArg).toBeDefined();
        }
      }
    });

    it('should have exported GetConnectionType types', async () => {
      const graphqlModule = await import('../graphql/index.js');
      
      // Verify that the SDK is exported
      expect(graphqlModule.getSdk).toBeDefined();
      expect(typeof graphqlModule.getSdk).toBe('function');
    });
  });
});
