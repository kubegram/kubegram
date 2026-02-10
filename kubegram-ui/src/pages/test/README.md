# CodeGenerationComponent Test Page

## Overview

A comprehensive test page for the `CodeGenerationComponent` located at `/test/codegen`. This interactive testing environment provides tools for validating component behavior, testing edge cases, and debugging functionality.

## Access

Navigate to: `http://localhost:5174/test/codegen` (when development server is running)

## Features

### 1. Interactive Control Panel
- **Basic Configuration**: Modify project name, LLM provider/model, graph type, node count
- **Authentication**: Optional token configuration for testing auth scenarios
- **Component Props**: Toggle Redux integration, stored code display
- **Advanced Settings**: Custom polling configurations

### 2. Test Scenarios
- **Predefined Scenarios**: 
  - Minimal graph (1 node)
  - Standard application (5 nodes)
  - Complex microservices (10+ nodes)
  - Error cases and edge conditions
- **Scenario Categories**:
  - Basic: Standard functionality tests
  - Stress: High-load and performance tests
  - Error: Failure condition testing
  - Edge: Boundary condition validation

### 3. Live Component Preview
- Real-time component rendering with current configuration
- Immediate visual feedback for config changes
- Side-by-side comparison capabilities
- Full component lifecycle testing

### 4. Test History & Monitoring
- **Execution Tracking**: Record of all test runs with timestamps
- **Result Categorization**: Success, error, pending states
- **Performance Metrics**: Duration tracking and analysis
- **Configuration Details**: Complete config snapshots for each test

### 5. Multiple View Modes
- **Split View**: Controls panel + component preview (default)
- **Component Only**: Full-screen component testing
- **Controls Only**: Configuration panel focus

## Usage Guide

### Basic Testing Workflow
1. **Configure Component**: Use the control panel to set desired parameters
2. **Select Scenario**: Choose a predefined test or create custom config
3. **Execute Test**: Click "Start Code Generation" on the component
4. **Monitor Results**: Watch progress and check test history
5. **Analyze**: Review success/failure patterns and performance

### Advanced Testing
1. **Error Simulation**: Use error scenarios to test error handling
2. **Performance Testing**: Run complex scenarios for load testing
3. **Edge Cases**: Test boundary conditions with minimal/empty graphs
4. **Integration Testing**: Test Redux vs non-Redux configurations

## Test Scenarios Explained

### Success Scenarios
- **Basic Success**: Standard 5-node Kubernetes graph
- **Minimal Success**: Single node for quick validation
- **Complex Success**: 20+ nodes for stress testing

### Error Scenarios
- **Invalid Credentials**: Tests authentication error handling
- **Invalid LLM Config**: Tests configuration validation
- **Empty Graph**: Tests empty input handling
- **Network Timeout**: Tests timeout behavior

### Edge Cases
- **Concurrent Requests**: Multiple simultaneous generations
- **Component Unmount**: Tests cleanup behavior
- **Redux Failures**: Tests fallback mechanisms

## Development Notes

### File Structure
```
src/
├── pages/test/
│   ├── CodegenTestPage.tsx         # Main test page component
│   └── index.ts                    # Test pages export
├── components/test/
│   ├── CodegenMockData.tsx         # Mock data generation
│   ├── CodegenTestControls.tsx      # Configuration panel
│   └── CodegenTestScenarios.tsx    # Test scenario runner
```

### Key Components

#### CodegenMockData
- Generates realistic test data for various scenarios
- Creates mock CanvasGraph, CanvasNode objects
- Provides predefined test configurations

#### CodegenTestControls
- Interactive configuration panel with tabs
- Real-time config updates
- Scenario loading functionality

#### CodegenTestScenarios
- Categorized test scenario execution
- Quick action buttons for common tests
- Test status tracking

#### CodegenTestPage
- Main orchestrator component
- Manages state between all test components
- Provides unified testing interface

## Integration

### Route Configuration
Added to `App.tsx`:
```tsx
<Route path="/test/codegen" element={<CodegenTestPage />} />
```

### Dependencies
- Uses existing UI components from `@/components/ui/`
- Integrates with Redux store for state management
- Leverages existing CodeGenerationComponent

## Best Practices

### When Using This Test Page
1. **Start Simple**: Begin with basic scenarios before complex ones
2. **Test Incrementally**: Change one parameter at a time
3. **Monitor History**: Use test history to track regression
4. **Document Findings**: Note any unexpected behaviors

### For Component Development
1. **Test Early**: Use this page during component development
2. **Validate Changes**: Test new features immediately
3. **Performance Check**: Monitor component performance with large datasets
4. **Error Coverage**: Ensure all error paths are tested

## Troubleshooting

### Common Issues
- **Component Not Rendering**: Check console for import errors
- **Redux Errors**: Verify Redux store is properly configured
- **Mock Data Issues**: Ensure mock data generation is working
- **Route Not Found**: Confirm routing configuration is correct

### Debug Mode
- Open browser developer tools
- Check console logs for component state changes
- Monitor Redux DevTools for state updates
- Use React DevTools for component debugging

## Future Enhancements

### Potential Improvements
- **API Mocking**: Mock server responses for complete isolation
- **Visual Regression**: Screenshot comparison capabilities
- **Performance Profiling**: Detailed performance metrics
- **Test Automation**: Automated test suite execution
- **Export/Import**: Save and load test configurations

### Integration Opportunities
- **CI/CD Integration**: Automated testing in pipelines
- **Component Library**: Integration with Storybook
- **Documentation**: Auto-generated test documentation
- **Reporting**: Test result analytics and reporting