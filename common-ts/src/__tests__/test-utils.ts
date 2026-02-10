/**
 * @fileoverview Test utilities for common-ts
 * 
 * This file contains test utilities that can be imported
 * by test files as needed, instead of being globally loaded.
 * 
 * @author Kubegram Team
 * @version 1.0.0
 */

import { jest, expect } from '@jest/globals';

// Global test utilities
export interface KubernetesResourceMatcher {
    toBeValidKubernetesResource(): any;
    toBeValidGraphNode(): any;
}

declare module 'expect' {
    interface Matchers<R> extends KubernetesResourceMatcher { }
}

// Custom Matchers Logic
const matchers = {
    toBeValidKubernetesResource(received: any) {
        const pass = received &&
            typeof received === 'object' &&
            received.kind &&
            received.apiVersion &&
            received.metadata;

        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid Kubernetes resource`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid Kubernetes resource with kind, apiVersion, and metadata`,
                pass: false,
            };
        }
    },

    toBeValidGraphNode(received: any) {
        const pass = received &&
            typeof received === 'object' &&
            received.resource &&
            Array.isArray(received.edges);

        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid graph node`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid graph node with resource and edges`,
                pass: false,
            };
        }
    },
};

// Test utilities object
export const testUtils = {
    /**
     * Create a mock Kubernetes resource for testing
     */
    createMockKubernetesResource: (overrides: any = {}) => ({
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
            name: 'test-pod',
            namespace: 'default',
            labels: { app: 'test' }
        },
        spec: {
            containers: [{
                name: 'test-container',
                image: 'nginx:latest'
            }]
        },
        ...overrides
    }),

    /**
     * Create a mock graph node for testing
     */
    createMockGraphNode: (overrides: any = {}) => ({
        resource: testUtils.createMockKubernetesResource(),
        edges: [],
        metadata: {
            status: 'active',
            labels: {}
        },
        ...overrides
    }),

    /**
     * Wait for a specified amount of time
     */
    wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

    /**
     * Create a mock function that returns a promise
     */
    createMockAsyncFunction: <T>(returnValue: T, delay: number = 0) =>
        jest.fn().mockImplementation(() =>
            delay > 0 ? testUtils.wait(delay).then(() => returnValue) : Promise.resolve(returnValue)
        ),

    /**
     * Register custom matchers with Jest
     */
    registerMatchers: () => {
        expect.extend(matchers);
    }
};
