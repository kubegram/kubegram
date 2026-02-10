/**
 * Kubegram Code Generation workflow is as follows:
 *
 * 1. The client connects to the server via websocket GraphQL subscription
 * 2. The client then sends the graph to the server backend to generate the code.
 * 3. The server backend then generates a job id and kicks up a code generation background job.
 * 4. The websocket connection then becomes idle until the code generation is complete.
 * 5. Once the code generation is complete, the server sends the generated code to the client via websocket GraphQL subscription.
 *
 * This test tests the above workflow.
 */

// import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import { GraphType, GraphNodeType } from '../generated/types.js';
import type { GraphInput, NodeInput } from '../generated/types.js';

// Use real services
const GRAPHQL_HTTP_URL = 'http://localhost:8665/graphql';
const GRAPHQL_WS_URL = 'ws://localhost:8665/graphql'; // Still defined but unused? Maybe remove.

// Skip these tests in CI or if SKIP_INTEGRATION_TESTS is set
const skipIntegration = process.env.SKIP_INTEGRATION_TESTS === 'true' || process.env.CI === 'true';
const describeIntegration = skipIntegration ? describe.skip : describe;

describeIntegration('codegen-scenario', () => {
  // let subClient: GraphQLSubscriptionClient; // Removed

  // beforeEach(() => { ... }); // Removed

  // afterEach(() => { ... }); // Removed

  describe('Microservice scenario', () => {
    const gatewayNode: NodeInput = {
      name: 'gateway-service',
      companyId: 'test-company',
      userId: 'test-user',
      nodeType: GraphNodeType.Microservice,
      namespace: 'kubegram',
      spec: {
        language: 'golang',
        framework: 'echo',
        version: '1.0.0',
        image: 'gateway-service:1.0.0',
        replicas: 2,
        ports: [8080],
        env: {
          PORT: '8080',
        },
      },
    };

    const ragNode: NodeInput = {
      name: 'rag-service',
      companyId: 'test-company',
      userId: 'test-user',
      nodeType: GraphNodeType.Microservice,
      namespace: 'kubegram',
      spec: {
        language: 'python3',
        framework: 'fastapi',
        version: '1.0.0',
        replicas: 2,
        ports: [8080],
      },
    };

    const uiNode: NodeInput = {
      name: 'ui-service',
      companyId: 'test-company',
      userId: 'test-user',
      nodeType: GraphNodeType.Microservice,
      namespace: 'kubegram',
      spec: {
        language: 'typescript',
        framework: 'react',
        version: '1.0.0',
        ports: [3000],
      },
    };

    const traefikNode: NodeInput = {
      name: 'traefik',
      companyId: 'test-company',
      userId: 'test-user',
      nodeType: GraphNodeType.Proxy,
      namespace: 'kubegram',
      spec: {
        kind: 'traefik',
        version: '2.7.0',
      },
    };

    const graphData: GraphInput = {
      name: 'kubegram-microservices-deploy-test',
      graphType: GraphType.Microservice,
      companyId: 'test-company',
      userId: 'test-user',
      description: 'Deploy test graph',
      nodes: [gatewayNode, ragNode, uiNode, traefikNode],
    };

    it('should execute the full code generation workflow', async () => {
      // 1. Initialize Code Generation via Mutation/Query
      const INITIALIZE_CODE_GEN_MUTATION = `
                mutation InitializeCodeGen($input: GenerateCodeInput!) {
                    initializeCodeGen(input: $input) {
                        jobId
                        status
                    }
                }
            `;

      console.log('Sending InitializeCodeGen request to:', GRAPHQL_HTTP_URL);
      try {
        // Using axios with standard object variables (server expects map[string]string/interface{})
        const response = await axios.post(
          GRAPHQL_HTTP_URL,
          {
            query: INITIALIZE_CODE_GEN_MUTATION,
            variables: {
              input: {
                graph: graphData,
                llmConfig: {
                  provider: 'DEEPSEEK',
                },
              },
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            validateStatus: () => true,
          }
        );

        console.log('InitializeCodeGen response status:', response.status);

        if (response.status !== 200 || response.data.errors) {
          throw new Error(`Failed to initialize codegen: ${JSON.stringify(response.data)}`);
        }

        if (!response.data.data) {
          throw new Error(`No data returned: ${JSON.stringify(response.data)}`);
        }

        const initializeCodeGen = response.data.data.initializeCodeGen;
        expect(initializeCodeGen).toBeDefined();
        expect(initializeCodeGen.jobId).toBeDefined();
        const jobId = initializeCodeGen.jobId;

        // 2. Poll for job completion
        const JOB_STATUS_QUERY = `
                    query JobStatus($input: JobStatusInput!) {
                        jobStatus(input: $input) {
                            jobId
                            status
                            step
                        }
                    }
                `;

        let jobStatus = 'pending';
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes with 5s delay

        console.log('Polling for job completion...');
        while (['pending', 'running'].includes(jobStatus) && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;

          const statusResponse = await axios.post(
            GRAPHQL_HTTP_URL,
            {
              query: JOB_STATUS_QUERY,
              variables: {
                input: { jobId },
              },
            },
            { headers: { 'Content-Type': 'application/json' } }
          );

          if (statusResponse.data.errors) {
            throw new Error(
              `Failed to get job status: ${JSON.stringify(statusResponse.data.errors)}`
            );
          }

          const statusData = statusResponse.data.data.jobStatus;
          if (!statusData) {
            throw new Error('No job status data returned');
          }
          jobStatus = statusData.status;
          console.log(`Job status (attempt ${attempts}): ${jobStatus} - Step: ${statusData.step}`);

          if (jobStatus === 'failed') {
            throw new Error(`Job failed: ${JSON.stringify(statusData)}`);
          }
        }

        if (jobStatus !== 'completed') {
          throw new Error(`Job timed out with status: ${jobStatus}`);
        }

        // 3. Get Generated Code
        const GET_GENERATED_CODE_QUERY = `
                    query GenerateCode($jobId: String!) {
                        generatedCode(jobId: $jobId) {
                            graphId
                            totalFiles
                            nodes {
                                name
                                spec
                                config
                                generatedCodeMetadata {
                                    fileName
                                    path
                                }
                            }
                        }
                    }
                `;

        console.log('Fetching generated code...');
        const codeResponse = await axios.post(
          GRAPHQL_HTTP_URL,
          {
            query: GET_GENERATED_CODE_QUERY,
            variables: { jobId },
          },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (codeResponse.data.errors) {
          throw new Error(
            `Failed to get generated code: ${JSON.stringify(codeResponse.data.errors)}`
          );
        }

        const generatedCode = codeResponse.data.data.generatedCode;

        expect(generatedCode).toBeDefined();
        expect(generatedCode.totalFiles).toBeGreaterThan(0);
        expect(generatedCode.nodes.length).toBeGreaterThan(0);
      } catch (error) {
        console.error('Test execution failed:', error);
        throw error;
      }
    }, 1800000); // 30m timeout
  });
});
