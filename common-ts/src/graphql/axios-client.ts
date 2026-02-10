import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { GraphQLError } from 'graphql';

/**
 * GraphQL request configuration
 */
export interface GraphQLRequestConfig {
  query: string;
  variables?: Record<string, unknown> | undefined;
  operationName?: string | undefined;
}

/**
 * GraphQL response format
 */
export interface GraphQLResponse<T = unknown> {
  data: T;
  errors?: GraphQLError[] | undefined;
  extensions?: unknown;
}

/**
 * Raw GraphQL response format (includes HTTP metadata)
 */
export interface RawGraphQLResponse<T = unknown> {
  data: T;
  errors?: GraphQLError[] | undefined;
  extensions?: unknown;
  headers: Record<string, string>;
  status: number;
}

/**
 * Axios-based GraphQL client that allows dependency injection
 */
export class AxiosGraphQLClient {
  private axiosInstance: AxiosInstance;
  private endpoint: string;
  private defaultHeaders: Record<string, string>;

  /**
   * Create a new AxiosGraphQLClient
   * @param endpoint - GraphQL endpoint URL
   * @param axiosInstance - Optional custom axios instance (defaults to global axios)
   * @param defaultHeaders - Optional default headers to include in all requests
   */
  constructor(
    endpoint: string,
    axiosInstance?: AxiosInstance,
    defaultHeaders?: Record<string, string>
  ) {
    this.endpoint = endpoint;
    this.axiosInstance = axiosInstance || axios;
    this.defaultHeaders = defaultHeaders || {};
  }

  /**
   * Execute a GraphQL request
   * @param config - GraphQL request configuration
   * @param requestHeaders - Optional headers for this specific request
   * @returns Promise with the response data
   */
  async request<T = unknown>(
    config: GraphQLRequestConfig,
    requestHeaders?: Record<string, string>
  ): Promise<T> {
    const response = await this.rawRequest<T>(config, requestHeaders);
    if (response.errors && response.errors.length > 0) {
      throw new GraphQLRequestError(response.errors, response);
    }
    return response.data;
  }

  /**
   * Execute a GraphQL request and return the raw response
   * @param config - GraphQL request configuration
   * @param requestHeaders - Optional headers for this specific request
   * @returns Promise with the raw response including HTTP metadata
   */
  async rawRequest<T = unknown>(
    config: GraphQLRequestConfig,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<T>> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...requestHeaders,
    };

    const axiosConfig: AxiosRequestConfig = {
      method: 'POST',
      url: this.endpoint,
      headers,
      data: {
        query: config.query,
        variables: config.variables,
        operationName: config.operationName,
      },
    };

    try {
      const response = await this.axiosInstance.request<GraphQLResponse<T>>(axiosConfig);

      return {
        data: response.data.data,
        errors: response.data.errors,
        extensions: response.data.extensions,
        headers: response.headers as Record<string, string>,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // If the server responded with an error, try to extract GraphQL errors
        const graphqlResponse = error.response.data as GraphQLResponse<T>;
        if (graphqlResponse && graphqlResponse.errors) {
          return {
            data: graphqlResponse.data,
            errors: graphqlResponse.errors,
            extensions: graphqlResponse.extensions,
            headers: error.response.headers as Record<string, string>,
            status: error.response.status,
          };
        }
      }
      throw error;
    }
  }

  /**
   * Update the endpoint URL
   * @param endpoint - New endpoint URL
   */
  setEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
  }

  /**
   * Update default headers
   * @param headers - Headers to merge with existing default headers
   */
  setHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Get the underlying axios instance
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

/**
 * Error class for GraphQL request errors
 */
export class GraphQLRequestError extends Error {
  public errors: GraphQLError[];
  public response: GraphQLResponse;

  constructor(errors: GraphQLError[], response: GraphQLResponse) {
    const message = errors.map(e => e.message).join('\n');
    super(message);
    this.name = 'GraphQLRequestError';
    this.errors = errors;
    this.response = response;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphQLRequestError);
    }
  }
}

/**
 * Create a new AxiosGraphQLClient instance
 * @param endpoint - GraphQL endpoint URL
 * @param axiosInstance - Optional custom axios instance
 * @param defaultHeaders - Optional default headers
 * @returns New AxiosGraphQLClient instance
 */
export function createGraphQLClient(
  endpoint: string,
  axiosInstance?: AxiosInstance,
  defaultHeaders?: Record<string, string>
): AxiosGraphQLClient {
  return new AxiosGraphQLClient(endpoint, axiosInstance, defaultHeaders);
}
