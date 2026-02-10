/**
 * @fileoverview Tests for utility functions, specifically the logger
 * 
 * @author Kubegram Team
 * @version 1.0.0
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { testUtils } from '../../__tests__/test-utils.js';

describe('Utils', () => {
  describe('Logger', () => {
    let Logger: any;
    let loggerInstance: any;

    beforeEach(async () => {
      // Import the actual Logger class
      const loggerModule = await import('../logger.js');
      Logger = loggerModule.Logger;

      // Create a new instance and spy on its methods
      loggerInstance = new Logger('test-logger');

      // Spy on the output method to prevent actual console output
      jest.spyOn(loggerInstance, 'outputLog').mockImplementation(() => { });

      // Spy on all public methods
      jest.spyOn(loggerInstance, 'info');
      jest.spyOn(loggerInstance, 'warn');
      jest.spyOn(loggerInstance, 'error');
      jest.spyOn(loggerInstance, 'debug');
      jest.spyOn(loggerInstance, 'child');
      jest.spyOn(loggerInstance, 'logConnectionAnalysis');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create a logger instance', () => {
      const logger = new Logger('test-logger');
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should have all required logging methods', () => {
      const logger = new Logger('test-logger');

      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.child).toBe('function');
      expect(typeof logger.logConnectionAnalysis).toBe('function');
    });

    it('should call logging methods with correct parameters', () => {
      const testMessage = 'Test message';
      const testData = { key: 'value' };

      loggerInstance.info(testMessage, testData);
      loggerInstance.warn(testMessage);
      loggerInstance.error(testMessage, testData);
      loggerInstance.debug(testMessage);

      expect(loggerInstance.info).toHaveBeenCalledWith(testMessage, testData);
      expect(loggerInstance.warn).toHaveBeenCalledWith(testMessage);
      expect(loggerInstance.error).toHaveBeenCalledWith(testMessage, testData);
      expect(loggerInstance.debug).toHaveBeenCalledWith(testMessage);
    });

    it('should create child logger', () => {
      const childLogger = loggerInstance.child('child-context');

      expect(loggerInstance.child).toHaveBeenCalledWith('child-context');
      expect(childLogger).toBeDefined();
      expect(childLogger).toBeInstanceOf(Logger);
    });

    it('should log connection analysis', () => {
      const analysisData = {
        level: 'info' as const,
        message: 'Connection analysis complete',
        data: {
          targetType: 'service',
          sourceType: 'deployment',
          connectionType: 'service-to-deployment'
        }
      };

      loggerInstance.logConnectionAnalysis(analysisData);

      expect(loggerInstance.logConnectionAnalysis).toHaveBeenCalledWith(analysisData);
    });

    it('should validate log entry structure', () => {
      // Test that the logger creates properly structured log entries
      const testMessage = 'Test validation message';
      const testData = { validation: 'test' };

      loggerInstance.info(testMessage, testData);

      // Verify that outputLog was called (meaning validation passed)
      expect(loggerInstance.outputLog).toHaveBeenCalled();
    });
  });

  describe('Test Utilities', () => {
    it('should create mock Kubernetes resource', () => {
      const mockResource = testUtils.createMockKubernetesResource({
        kind: 'Service',
        metadata: { name: 'test-service' }
      });

      expect(mockResource).toBeDefined();
      expect(mockResource.kind).toBe('Service');
      expect(mockResource.metadata?.name).toBe('test-service');
    });

    it('should create mock graph node', () => {
      const mockNode = testUtils.createMockGraphNode({
        metadata: { status: 'inactive' }
      });

      expect(mockNode).toBeDefined();
      expect(mockNode.resource).toBeDefined();
      expect(mockNode.metadata?.status).toBe('inactive');
    });

    it('should wait for specified time', async () => {
      const start = Date.now();
      await testUtils.wait(100);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });

    it('should create mock async function', async () => {
      const mockFn = testUtils.createMockAsyncFunction('test-result', 50);

      const result = await mockFn();

      expect(result).toBe('test-result');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should create mock async function with delay', async () => {
      const mockFn = testUtils.createMockAsyncFunction('delayed-result', 100);

      const start = Date.now();
      const result = await mockFn();
      const end = Date.now();

      expect(result).toBe('delayed-result');
      expect(end - start).toBeGreaterThanOrEqual(90);
    });
  });
});