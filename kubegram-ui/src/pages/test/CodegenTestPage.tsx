import React, { useState } from 'react';
import { CodeGenerationComponent } from '@/components/CodeGenerationComponent';
import { CodegenTestControls } from '@/components/test/CodegenTestControls';
import { CodegenTestScenarios } from '@/components/test/CodegenTestScenarios';
import { CodegenMockData } from '@/components/test/CodegenMockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { InitiateCodegenInput } from '@/store/api/codegen';
import { Monitor, Settings, Play, History, Activity } from 'lucide-react';

interface TestScenario {
  id: string;
  name: string;
  config?: Partial<InitiateCodegenInput>;
}

/**
 * Comprehensive test page for CodeGenerationComponent
 */
const CodegenTestPage: React.FC = () => {
  const [config, setConfig] = useState<InitiateCodegenInput & {
    token?: string;
    preset?: string;
    useRedux?: boolean;
    showStoredCode?: boolean;
    customConfig?: any;
  }>(() => ({
    ...CodegenMockData.generateCodegenInput(),
    token: undefined,
    preset: 'standard',
    useRedux: true,
    showStoredCode: true,
    customConfig: undefined
  }));

  const [testHistory, setTestHistory] = useState<Array<{
    id: string;
    timestamp: number;
    scenario: string;
    result: 'success' | 'error' | 'pending';
    duration?: number;
    details?: string;
  }>>([]);

  const [activeView, setActiveView] = useState<'split' | 'component' | 'controls'>('split');

  const handleConfigChange = (newConfig: typeof config) => {
    setConfig(newConfig);
  };

  const handleRunScenario = (scenario: TestScenario | string) => {
    const testId = `test-${Date.now()}`;
    const scenarioName = typeof scenario === 'string' ? scenario : scenario.name;
    const scenarioConfig = typeof scenario === 'string' ? undefined : scenario.config;
    
    // Add to history
    setTestHistory(prev => [
      {
        id: testId,
        timestamp: Date.now(),
        scenario: scenarioName,
        result: 'pending',
        details: scenarioConfig ? `Config: ${JSON.stringify(scenarioConfig, null, 2)}` : `Using current config`
      },
      ...prev.slice(0, 9) // Keep last 10 tests
    ]);

    // Simulate test execution (in real implementation, this would trigger the actual test)
    setTimeout(() => {
      setTestHistory(prev => 
        prev.map(test => 
          test.id === testId 
            ? { 
                ...test, 
                result: Math.random() > 0.3 ? 'success' : 'error',
                duration: Math.floor(Math.random() * 30000) + 5000
              }
            : test
        )
      );
    }, 2000);
  };

  const handleComponentComplete = (result: any) => {
    console.log('Component completed:', result);
    // Update test history with success
    setTestHistory(prev => 
      prev.map(test => 
        test.result === 'pending' 
          ? { ...test, result: 'success', duration: Date.now() - test.timestamp }
          : test
      )
    );
  };

  const handleComponentError = (error: string) => {
    console.error('Component error:', error);
    // Update test history with error
    setTestHistory(prev => 
      prev.map(test => 
        test.result === 'pending' 
          ? { ...test, result: 'error', details: error }
          : test
      )
    );
  };

  const clearHistory = () => {
    setTestHistory([]);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Monitor className="h-8 w-8 mr-3 text-blue-600" />
              CodeGenerationComponent Test Page
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive testing environment for the code generation component
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              {testHistory.filter(t => t.result === 'pending').length} Running
            </Badge>
            <Badge variant="outline" className="text-sm">
              {testHistory.length} Total Tests
            </Badge>
          </div>
        </div>
      </div>

      {/* View Selector */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex space-x-2">
          {[
            { id: 'split', label: 'Split View', icon: <Activity className="h-4 w-4" /> },
            { id: 'component', label: 'Component Only', icon: <Play className="h-4 w-4" /> },
            { id: 'controls', label: 'Controls Only', icon: <Settings className="h-4 w-4" /> }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                activeView === view.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              {view.icon}
              <span>{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className={`grid ${activeView === 'split' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          
          {/* Controls Section */}
          {(activeView === 'split' || activeView === 'controls') && (
            <div className={activeView === 'split' ? 'lg:col-span-1' : ''}>
              <CodegenTestControls
                onConfigChange={handleConfigChange}
                onRunScenario={handleRunScenario}
              />
              
              {/* Test History */}
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <History className="h-5 w-5 mr-2" />
                    Test History
                  </CardTitle>
                  <button
                    onClick={clearHistory}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </CardHeader>
                <CardContent>
                  {testHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No tests run yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {testHistory.map((test) => (
                        <div
                          key={test.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${
                              test.result === 'success' ? 'bg-green-500' :
                              test.result === 'error' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }`} />
                            <div>
                              <div className="text-sm font-medium">{test.scenario}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(test.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {test.duration && (
                              <div className="text-xs text-gray-500">
                                {formatDuration(test.duration)}
                              </div>
                            )}
                            <Badge
                              variant={
                                test.result === 'success' ? 'default' :
                                test.result === 'error' ? 'destructive' :
                                'secondary'
                              }
                              className="text-xs"
                            >
                              {test.result}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Component Preview Section */}
          {(activeView === 'split' || activeView === 'component') && (
            <div className={activeView === 'split' ? 'lg:col-span-2' : ''}>
              {/* Component Under Test */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Play className="h-5 w-5 mr-2" />
                    Component Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[400px]">
                    <CodeGenerationComponent
                      input={config}
                      token={config.token}
                      preset={config.preset as any}
                      customConfig={config.customConfig}
                      useRedux={config.useRedux}
                      showStoredCode={config.showStoredCode}
                      onComplete={handleComponentComplete}
                      onError={handleComponentError}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Test Scenarios */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Test Scenarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodegenTestScenarios
                    config={config}
                    onExecuteScenario={handleRunScenario}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Status Alert */}
        {testHistory.some(t => t.result === 'pending') && (
          <Alert className="mt-6">
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Tests are currently running. Check the test history for results.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default CodegenTestPage;