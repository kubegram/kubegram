/**
 * @fileoverview Structured logging utility using Zod for validation
 *
 * This module provides a type-safe logging system that uses Zod schemas
 * to validate log data and ensure consistent logging across the application.
 *
 * @author Kubegram Team
 * @version 1.0.2
 */

import { z } from 'zod';

/**
 * Log levels for structured logging
 */
export const LogLevelEnum = z.enum(['debug', 'info', 'warn', 'error']);
export type LogLevel = z.infer<typeof LogLevelEnum>;

/**
 * Base log entry schema
 */
const BaseLogEntrySchema = z.object({
  timestamp: z.string(),
  level: LogLevelEnum,
  message: z.string(),
  context: z.string().optional(),
  data: z.record(z.string(), z.any()).optional(), // eslint-disable-line @typescript-eslint/no-explicit-any
});

/**
 * Connection analysis log entry schema
 */
const ConnectionAnalysisLogSchema = BaseLogEntrySchema.extend({
  context: z.literal('connection-analysis'),
  data: z.object({
    targetType: z.string().optional(),
    sourceType: z.string().optional(),
    connectionType: z.string().optional(),
    resourceType: z.string().optional(),
    path: z.array(z.string()).optional(),
    result: z
      .object({
        isValid: z.boolean().optional(),
        errors: z.array(z.string()).optional(),
        warnings: z.array(z.string()).optional(),
      })
      .optional(),
  }),
});

type LogEntry = z.infer<typeof BaseLogEntrySchema>;
type ConnectionAnalysisLogEntry = z.infer<typeof ConnectionAnalysisLogSchema>;

/**
 * Logger class for structured logging
 */
export class Logger {
  private context: string;

  constructor(context: string = 'default') {
    this.context = context;
  }

  /**
   * Create a child logger with a specific context
   */
  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`);
  }

  /**
   * Log a debug message
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(message: string, data?: Record<string, any>): void {
    this.log('debug', message, data);
  }

  /**
   * Log an info message
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(message: string, data?: Record<string, any>): void {
    this.log('info', message, data);
  }

  /**
   * Log a warning message
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(message: string, data?: Record<string, any>): void {
    this.log('warn', message, data);
  }

  /**
   * Log an error message
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(message: string, data?: Record<string, any>): void {
    this.log('error', message, data);
  }

  /**
   * Log connection analysis results
   */
  logConnectionAnalysis(
    entry: Omit<ConnectionAnalysisLogEntry, 'timestamp' | 'context'> & { level?: LogLevel }
  ): void {
    const logEntry: ConnectionAnalysisLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      level: entry.level || 'info',
      context: 'connection-analysis',
    };

    // Validate the log entry
    const validatedEntry = ConnectionAnalysisLogSchema.parse(logEntry);

    // Output the structured log
    this.outputLog(validatedEntry);
  }

  /**
   * Internal logging method
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private log(level: LogLevel, message: string, data?: Record<string, any>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      data,
    };

    // Validate the log entry
    const validatedEntry = BaseLogEntrySchema.parse(logEntry);

    // Output the structured log
    this.outputLog(validatedEntry);
  }

  /**
   * Output the log entry (can be overridden for different outputs)
   */
  protected outputLog(entry: LogEntry | ConnectionAnalysisLogEntry): void {
    // In a real application, this would send to a logging service
    // For now, we'll use console with structured output
    if (typeof console !== 'undefined') {
      const logMethod = this.getConsoleMethod(entry.level);
      /* eslint-disable no-console */
      logMethod(JSON.stringify(entry, null, 2));
      /* eslint-enable no-console */
    }
  }

  /**
   * Get the appropriate console method for the log level
   */
  /* eslint-disable no-console */
  private getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case 'debug':
        return console.debug || console.log;
      case 'info':
        return console.info || console.log;
      case 'warn':
        return console.warn || console.log;
      case 'error':
        return console.error || console.log;
      default:
        return console.log;
    }
  }
  /* eslint-enable no-console */
}

/**
 * Default logger instance
 */
export const logger = new Logger('common-ts');

/**
 * Connection analysis logger
 */
export const connectionLogger = logger.child('connection-analysis');
