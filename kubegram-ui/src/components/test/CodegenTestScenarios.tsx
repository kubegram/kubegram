import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CodegenMockData } from './CodegenMockData';
import type { InitiateCodegenInput } from '@/store/api/codegen';
import { Play, Zap, AlertTriangle, Timer, BarChart3 } from 'lucide-react';

/**
 * Test scenarios for CodeGenerationComponent
 */
interface CodegenTestScenariosProps {
  config: InitiateCodegenInput & {
    token?: string;
    preset?: string;
    useRedux?: boolean;
    showStoredCode?: boolean;
    customConfig?: any;
  };
  onExecuteScenario: (scenario: TestScenario) => void;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'stress' | 'error' | 'edge';
  config?: Partial<InitiateCodegenInput>;
  expectedResult?: 'success' | 'error' | 'timeout';
  estimatedDuration: string;
  icon: React.ReactNode;
}

export const CodegenTestScenarios: React.FC<CodegenTestScenariosProps> = ({
  config,
  onExecuteScenario
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [runningScenario, setRunningScenario] = useState<string | null>(null);

  const scenarios: TestScenario[] = [
    {
      id: 'basic-success',
      name: 'Basic Success',
      description: 'Standard code generation with a simple graph',
      category: 'basic',
      expectedResult: 'success',
      estimatedDuration: '30s',
      icon: <Play className="h-4 w-4" />
    },
    {
      id: 'minimal-graph',
      name: 'Minimal Graph',
      description: 'Single node graph',
      category: 'edge',
      expectedResult: 'success',
      estimatedDuration: '10s',
      icon: <Zap className="h-4 w-4" />
    },
    {
      id: 'complex-graph',
      name: 'Complex Graph',
      description: 'Large graph with many nodes and connections',
      category: 'stress',
      expectedResult: 'success',
      estimatedDuration: '2-5m',
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      id: 'invalid-credentials',
      name: 'Invalid Credentials',
      description: 'Test with invalid or missing auth token',
      category: 'error',
      expectedResult: 'error',
      estimatedDuration: '5s',
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      id: 'network-timeout',
      name: 'Network Timeout',
      description: 'Simulate network timeout scenarios',
      category: 'error',
      expectedResult: 'timeout',
      estimatedDuration: '30s',
      icon: <Timer className="h-4 w-4" />
    },
    {
      id: 'concurrent-requests',
      name: 'Concurrent Requests',
      description: 'Multiple simultaneous generation requests',
      category: 'stress',
      expectedResult: 'success',
      estimatedDuration: '1-3m',
      icon: <Zap className="h-4 w-4" />
    },
    {
      id: 'empty-graph',
      name: 'Empty Graph',
      description: 'Graph with no nodes',
      category: 'edge',
      expectedResult: 'error',
      estimatedDuration: '5s',
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      id: 'invalid-llm-config',
      name: 'Invalid LLM Config',
      description: 'Invalid LLM provider or model',
      category: 'error',
      expectedResult: 'error',
      estimatedDuration: '5s',
      icon: <AlertTriangle className="h-4 w-4" />
    }
  ];

  const categories = [
    { id: 'all', name: 'All', color: 'bg-gray-500' },
    { id: 'basic', name: 'Basic', color: 'bg-blue-500' },
    { id: 'stress', name: 'Stress', color: 'bg-orange-500' },
    { id: 'error', name: 'Error', color: 'bg-red-500' },
    { id: 'edge', name: 'Edge Cases', color: 'bg-purple-500' }
  ];

  const filteredScenarios = selectedCategory === 'all' 
    ? scenarios 
    : scenarios.filter(s => s.category === selectedCategory);

  const executeScenario = (scenario: TestScenario) => {
    setRunningScenario(scenario.id);
    
    let scenarioConfig = { ...config };

    // Apply scenario-specific configurations
    switch (scenario.id) {
      case 'minimal-graph':
        scenarioConfig = {
          ...scenarioConfig,
          graph: CodegenMockData.generateGraph({ nodeCount: 1 })
        };
        break;
      
      case 'complex-graph':
        scenarioConfig = {
          ...scenarioConfig,
          graph: CodegenMockData.generateGraph({ nodeCount: 20 })
        };
        break;
      
      case 'invalid-credentials':
        scenarioConfig = {
          ...scenarioConfig,
          token: 'invalid-token-123'
        };
        break;
      
      case 'empty-graph':
        scenarioConfig = {
          ...scenarioConfig,
          graph: CodegenMockData.generateGraph({ nodeCount: 0 })
        };
        break;
      
      case 'invalid-llm-config':
        scenarioConfig = {
          ...scenarioConfig,
          llmConfig: {
            provider: 'invalid-provider',
            model: 'invalid-model'
          }
        };
        break;
      
      default:
        // Use default config for other scenarios
        break;
    }

    onExecuteScenario({
      ...scenario,
      config: scenarioConfig
    });

    // Reset running state after a delay
    setTimeout(() => {
      setRunningScenario(null);
    }, 3000);
  };

  const getStatusColor = (expectedResult?: string) => {
    switch (expectedResult) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'timeout': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Test Scenarios</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'text-white bg-blue-500'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`border rounded-lg p-4 transition-all ${
                runningScenario === scenario.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getStatusColor(scenario.expectedResult)}`}>
                    {scenario.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{scenario.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {scenario.category}
                    </Badge>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{scenario.estimatedDuration}</span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {scenario.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(scenario.expectedResult)}`} />
                  <span className="text-xs text-muted-foreground capitalize">
                    {scenario.expectedResult || 'unknown'}
                  </span>
                </div>
                
                <Button
                  size="sm"
                  variant={runningScenario === scenario.id ? "secondary" : "outline"}
                  onClick={() => executeScenario(scenario)}
                  disabled={runningScenario !== null}
                >
                  {runningScenario === scenario.id ? 'Running...' : 'Execute'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Running Indicator */}
        {runningScenario && (
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              Scenario "{scenarios.find(s => s.id === runningScenario)?.name}" is currently running...
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium mb-2">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeScenario(scenarios.find(s => s.id === 'basic-success')!)}
            >
              <Play className="h-3 w-3 mr-1" />
              Quick Test
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeScenario(scenarios.find(s => s.id === 'concurrent-requests')!)}
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Stress Test
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeScenario(scenarios.find(s => s.id === 'invalid-credentials')!)}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Error Test
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};