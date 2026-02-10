import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CodegenMockData } from './CodegenMockData';
import type { InitiateCodegenInput } from '@/store/api/codegen';

import { Settings, Play, AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Test control panel for CodeGenerationComponent
 */
interface CodegenTestControlsProps {
  onConfigChange: (config: InitiateCodegenInput & {
    token?: string;
    preset?: string;
    useRedux?: boolean;
    showStoredCode?: boolean;
    customConfig?: any;
  }) => void;
  onRunScenario: (scenario: string) => void;
}

export const CodegenTestControls: React.FC<CodegenTestControlsProps> = ({
  onConfigChange,
  onRunScenario
}) => {
  const [config, setConfig] = useState<InitiateCodegenInput & {
    token?: string;
    preset?: string;
    useRedux?: boolean;
    showStoredCode?: boolean;
    customConfig?: any;
  }>({
    ...CodegenMockData.generateCodegenInput(),
    token: '',
    preset: 'standard',
    useRedux: true,
    showStoredCode: true,
    customConfig: undefined
  });

  const [activeSection, setActiveSection] = useState('basic');

  const scenarios = CodegenMockData.getScenarios();

  const updateConfig = (updates: Partial<typeof config>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const loadScenario = (scenarioName: string) => {
    const scenarioConfig = scenarios[scenarioName as keyof typeof scenarios];
    if (scenarioConfig) {
      updateConfig({
        ...scenarioConfig,
        token: config.token,
        preset: config.preset,
        useRedux: config.useRedux,
        showStoredCode: config.showStoredCode,
        customConfig: config.customConfig
      });
    }
  };

  const resetConfig = () => {
    const defaultConfig = {
      ...CodegenMockData.generateCodegenInput(),
      token: '',
      preset: 'standard',
      useRedux: true,
      showStoredCode: true,
      customConfig: undefined
    };
    setConfig(defaultConfig);
    onConfigChange(defaultConfig);
  };

  const handleBooleanChange = (field: 'useRedux' | 'showStoredCode', value: boolean) => {
    updateConfig({ [field]: value });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Test Controls</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Section Tabs */}
        <div className="flex space-x-2 border-b">
          {['basic', 'scenarios', 'advanced'].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeSection === section
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
        </div>

        {/* Basic Configuration */}
        {activeSection === 'basic' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={config.project.name}
                  onChange={(e) => updateConfig({
                    project: { ...config.project, name: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="llmProvider">LLM Provider</Label>
                <Input
                  id="llmProvider"
                  value={config.llmConfig.provider}
                  onChange={(e) => updateConfig({
                    llmConfig: { ...config.llmConfig, provider: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="llmModel">LLM Model</Label>
                <Input
                  id="llmModel"
                  value={config.llmConfig.model}
                  onChange={(e) => updateConfig({
                    llmConfig: { ...config.llmConfig, model: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="graphType">Graph Type</Label>
                <Input
                  id="graphType"
                  value={config.graph.graphType}
                  onChange={(e) => updateConfig({
                    graph: { ...config.graph, graphType: e.target.value as any }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nodeCount">Node Count</Label>
                <Input
                  id="nodeCount"
                  type="number"
                  value={config.graph.nodes?.length || 0}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 0;
                    const newGraph = CodegenMockData.generateGraph({ nodeCount: count });
                    updateConfig({ graph: newGraph });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="authToken">Auth Token (Optional)</Label>
                <Input
                  id="authToken"
                  type="password"
                  placeholder="Leave empty for no auth"
                  value={config.token || ''}
                  onChange={(e) => updateConfig({ token: e.target.value || undefined })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 pt-4 border-t">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.useRedux || false}
                  onChange={(e) => handleBooleanChange('useRedux', e.target.checked)}
                  className="rounded"
                />
                <span>Use Redux</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.showStoredCode || false}
                  onChange={(e) => handleBooleanChange('showStoredCode', e.target.checked)}
                  className="rounded"
                />
                <span>Show Stored Code</span>
              </label>
            </div>
          </div>
        )}

        {/* Scenarios */}
        {activeSection === 'scenarios' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(scenarios).map(([name, scenario]) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{name}</Badge>
                      <span className="text-sm font-medium">{scenario.project.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {scenario.graph.nodes?.length || 0} nodes • {scenario.llmConfig.provider}/{scenario.llmConfig.model}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadScenario(name)}
                  >
                    Load
                  </Button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <Button onClick={() => onRunScenario('success')} className="mr-2">
                <Play className="h-4 w-4 mr-2" />
                Run Success Scenario
              </Button>
              <Button onClick={() => onRunScenario('error')} variant="destructive">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Run Error Scenario
              </Button>
            </div>
          </div>
        )}

        {/* Advanced Configuration */}
        {activeSection === 'advanced' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preset">Polling Preset</Label>
              <Input
                id="preset"
                value={config.preset || ''}
                onChange={(e) => updateConfig({ preset: e.target.value })}
                placeholder="standard"
              />
            </div>

            <div className="space-y-2">
              <Label>Custom Configuration (JSON)</Label>
              <textarea
                className="w-full h-32 p-3 border rounded-md text-sm font-mono"
                placeholder='{"initialDelay": 1000, "maxDelay": 5000}'
                onChange={(e) => {
                  try {
                    const customConfig = e.target.value ? JSON.parse(e.target.value) : undefined;
                    updateConfig({ customConfig });
                  } catch (error) {
                    // Invalid JSON, ignore for now
                  }
                }}
              />
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Button onClick={resetConfig} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};