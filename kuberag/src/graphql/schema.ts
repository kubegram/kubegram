/**
 * Pothos schema builder for GraphQL API
 * Creates schema with all active types, enums, inputs, and resolvers
 */

import PothosSchemaBuilder from '@pothos/core';
import type { AppSchemaTypes } from './schema-types';
import { registerEnums } from './types/enums';
import { registerGraphTypes } from './types/graph';
import { registerResourceTypes } from './types/resources';
import { registerCodegenTypes } from './types/codegen';
import { registerInputTypes } from './types/inputs';
import { registerPlanTypes } from './types/plan';
import { registerPlanInputTypes } from './types/plan-inputs';
import { registerQueries } from './resolvers/queries';
import { registerMutations } from './resolvers/mutations';

// Create schema builder instance with scalar types
export const builder = new PothosSchemaBuilder<AppSchemaTypes>({
  defaults: 'v4',
});

// Export the builder type for use in type registration files
export type SchemaBuilder = PothosSchemaTypes.SchemaBuilder<
  PothosSchemaTypes.ExtendDefaultTypes<AppSchemaTypes>
>;

// Register JSON scalar
builder.scalarType('JSON', {
  serialize: (value) => value,
  parseValue: (value) => value as Record<string, unknown>,
});

// Register DateTime scalar (ISO 8601 timestamp)
builder.scalarType('DateTime', {
  serialize: (value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return value;
    }
    return new Date(String(value)).toISOString();
  },
  parseValue: (value) => {
    if (typeof value === 'string') {
      return new Date(value);
    }
    return new Date(String(value));
  },
});

// Register YAML scalar
builder.scalarType('YAML', {
  serialize: (value) => {
    if (typeof value === 'string') {
      return value;
    }
    return String(value);
  },
  parseValue: (value) => {
    if (typeof value === 'string') {
      return value;
    }
    return String(value);
  },
});

// Register ID scalar
builder.scalarType('ID', {
  serialize: (value) => {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return String(value);
  },
  parseValue: (value) => {
    if (typeof value === 'string') {
      return value;
    }
    return String(value);
  },
});

// Register all types in correct order
registerEnums(builder);
registerGraphTypes(builder);
registerResourceTypes(builder);
registerCodegenTypes(builder);
registerInputTypes(builder);
registerPlanTypes(builder);
registerPlanInputTypes(builder);

// Register resolvers
registerQueries(builder);
registerMutations(builder);

// Build the schema
export const schema = builder.toSchema();
