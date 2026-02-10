/**
 * Pothos enum type registrations
 * Registers all GraphQL enums with the schema builder
 */

import type { EnumRef } from '@pothos/core';
import type { AppSchemaTypes } from '../schema-types';
import {
  ConnectionType,
  DependencyType,
  DeploymentStrategy,
  GraphNodeType,
  GraphType,
  KubernetesClusterType,
  ModelProvider,
  ModelName,
  JobStatusStatus,
} from '../../types/enums';
import type { SchemaBuilder } from '../schema';

type SchemaTypes = PothosSchemaTypes.ExtendDefaultTypes<AppSchemaTypes>;

export let GraphNodeTypeEnum: EnumRef<SchemaTypes, GraphNodeType>;
export let DependencyTypeEnum: EnumRef<SchemaTypes, DependencyType>;
export let GraphTypeEnum: EnumRef<SchemaTypes, GraphType>;
export let ConnectionTypeEnum: EnumRef<SchemaTypes, ConnectionType>;
export let KubernetesClusterTypeEnum: EnumRef<SchemaTypes, KubernetesClusterType>;
export let DeploymentStrategyEnum: EnumRef<SchemaTypes, DeploymentStrategy>;
export let ModelProviderEnum: EnumRef<SchemaTypes, ModelProvider>;
export let ModelNameEnum: EnumRef<SchemaTypes, ModelName>;
export let JobStatusStatusEnum: EnumRef<SchemaTypes, JobStatusStatus>;

export function registerEnums(builder: SchemaBuilder) {
  // GraphNodeType enum
  GraphNodeTypeEnum = builder.enumType(GraphNodeType, {
    name: 'GraphNodeType',
  });

  // DependencyType enum
  DependencyTypeEnum = builder.enumType(DependencyType, {
    name: 'DependencyType',
  });

  // GraphType enum
  GraphTypeEnum = builder.enumType(GraphType, {
    name: 'GraphType',
  });

  // ConnectionType enum
  ConnectionTypeEnum = builder.enumType(ConnectionType, {
    name: 'ConnectionType',
  });

  // KubernetesClusterType enum
  KubernetesClusterTypeEnum = builder.enumType(KubernetesClusterType, {
    name: 'KubernetesClusterType',
  });

  // DeploymentStrategy enum
  DeploymentStrategyEnum = builder.enumType(DeploymentStrategy, {
    name: 'DeploymentStrategy',
  });

  // ModelProvider enum
  ModelProviderEnum = builder.enumType(ModelProvider, {
    name: 'ModelProvider',
  });

  // ModelName enum
  ModelNameEnum = builder.enumType(ModelName, {
    name: 'ModelName',
  });

  // JobStatusStatus enum
  JobStatusStatusEnum = builder.enumType(JobStatusStatus, {
    name: 'JobStatusStatus',
  });
}
