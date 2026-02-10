# Enhanced CodeViewPage Documentation

This document describes the enhanced CodeViewPage that integrates generated code side by side with the graph visualization.

## 🎯 Overview

The enhanced CodeViewPage provides a comprehensive interface for viewing both node configurations and generated code in a side-by-side layout. It integrates with the Redux codegen state to display generated code for each node and provides tools for code generation, visualization, and management.

## 🏗️ Architecture

### Component Structure

```
CodeViewPage
├── KonvaPage (70% width)
│   └── Graph visualization with node selection
└── CodePanel (30% width)
    ├── Header (view mode toggle + statistics)
    ├── CodeGenerationStatus (generation progress)
    ├── Code Generation Controls
    └── Content Area
        ├── Configuration View
        │   └── Node configuration JSON
        └── Generated Code View
            ├── GeneratedCodeDisplay
            │   ├── Code versions
            │   ├── Syntax highlighting
            │   ├── Search functionality
            │   └── Export controls
            └── Empty states
```

### Key Components

1. **CodeViewPage** - Main page component with 70/30 split layout
2. **CodePanel** - Enhanced panel with config/code toggle and generation controls
3. **GeneratedCodeDisplay** - Dedicated component for code visualization
4. **CodeGenerationStatus** - Status indicator for code generation progress

## 📊 Data Flow

### Redux Integration
```
1. User selects node → CodeViewPage receives nodeId
2. CodePanel gets graphId from project state
3. Redux selectors retrieve data:
   - selectGeneratedCodeForNode(state, graphId, nodeId)
   - selectCodegenState(state)
   - selectCodegenStats(state)
4. Components display data with proper loading/error states
```

### State Management
```typescript
// Key selectors used
const generatedCode = useAppSelector((state) => 
  selectGeneratedCodeForNode(state, graphId, selectedNode?.id || '')
);

const codegenState = useAppSelector(selectCodegenState);
const codegenStats = useAppSelector(selectCodegenStats);
const project = useAppSelector((state) => state.project.project);
```

## 🎨 UI Features

### View Mode Toggle
- **Config View**: Shows node configuration as JSON
- **Generated Code View**: Shows generated code with syntax highlighting
- Smooth transitions between views
- Persistent view mode selection

### Code Generation Controls
- **Generate Code Button**: Triggers code generation for entire graph
- **Progress Indicators**: Real-time feedback during generation
- **Status Display**: Current generation status and statistics
- **Error Handling**: User-friendly error messages

### Generated Code Display
- **Multiple Versions**: Support for multiple code versions per node
- **Syntax Highlighting**: Language-aware code highlighting
- **Search Functionality**: Find within generated code
- **Export Controls**: Copy and download code files
- **Language Detection**: Automatic language/framework identification

### Status Indicators
- **Loading States**: Spinners and progress bars
- **Error States**: Clear error messages with actions
- **Success States**: Completion indicators with statistics
- **Empty States**: Helpful messages and call-to-actions

## 🔧 Usage Examples

### Basic Usage
```typescript
<CodeViewPage 
  isSidebarCollapsed={false}
  isHeaderCollapsed={false}
  showGeneratedCode={true}
/>
```

### With Custom Props
```typescript
<CodeViewPage 
  isSidebarCollapsed={true}
  isHeaderCollapsed={true}
  showGeneratedCode={false} // Only show configuration
/>
```

### Integration with Routing
```typescript
// In your router configuration
<Route
  path="/code-view"
  element={
    <ProtectedRoute>
      <CodeViewPage />
    </ProtectedRoute>
  }
/>
```

## 📱 Responsive Design

### Layout Breakpoints
- **Desktop**: 70/30 split between graph and code panel
- **Tablet**: Maintains 70/30 split with adjusted sizing
- **Mobile**: Stack layout with collapsible code panel

### Adaptive Features
- **Responsive Controls**: Button sizes and spacing adjust
- **Scrollable Code**: Code areas scroll independently
- **Touch-Friendly**: Larger touch targets on mobile devices

## 🧪 Testing

### Test Coverage
- ✅ Component rendering
- ✅ View mode switching
- ✅ Code generation integration
- ✅ Error handling
- ✅ Loading states
- ✅ Empty states
- ✅ Redux integration

### Test Files
- `CodeViewPage.test.tsx` - Main component tests
- Integration tests for complete flow
- Component unit tests for sub-components

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test CodeViewPage.test.tsx

# Run with coverage
npm test -- --coverage
```

## 🔍 Code Examples

### Generated Code Display
```typescript
// Multiple code versions
<GeneratedCodeDisplay
  codes={generatedCode}
  nodeId="node-123"
  nodeLabel="Web Service"
  onCopy={handleCopy}
  onDownload={handleDownload}
/>
```

### Status Component
```typescript
// Generation status
<CodeGenerationStatus 
  graphId="graph-456"
  className="mb-4"
/>
```

### Custom Integration
```typescript
// With custom state management
const CodeViewPageWithCustomState = () => {
  const [customState, setCustomState] = useState({});
  
  return (
    <CodeViewPage
      isSidebarCollapsed={customState.collapsed}
      showGeneratedCode={customState.showCode}
    />
  );
};
```

## 🚀 Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Code display loads on demand
- **Memoization**: Components memoized to prevent unnecessary re-renders
- **Efficient Selectors**: Optimized Redux selectors
- **Virtual Scrolling**: For large code files (future enhancement)

### Memory Management
- **Cleanup**: Proper cleanup of intervals and timeouts
- **State Reset**: Clear state when unmounting
- **Event Listeners**: Remove event listeners on unmount

## 🔧 Configuration

### Props Interface
```typescript
interface CodeViewPageProps {
  isSidebarCollapsed?: boolean;
  isHeaderCollapsed?: boolean;
  showGeneratedCode?: boolean;
}
```

### Default Props
```typescript
const defaultProps = {
  isSidebarCollapsed: false,
  isHeaderCollapsed: false,
  showGeneratedCode: true
};
```

### Environment Variables
```typescript
// Feature flags
const ENABLE_CODE_GENERATION = process.env.REACT_APP_ENABLE_CODE_GEN === 'true';
const ENABLE_SYNTAX_HIGHLIGHTING = process.env.REACT_APP_ENABLE_SYNTAX === 'true';
```

## 🐛 Troubleshooting

### Common Issues

#### Generated Code Not Showing
**Problem**: Code panel shows "No Generated Code" even after generation
**Solution**: 
1. Check if graph ID is properly set
2. Verify Redux state has stored code
3. Check codegen selectors are working correctly

#### Code Generation Button Disabled
**Problem**: Generate button is disabled
**Solution**:
1. Verify project.graph.id exists
2. Check if user is authenticated
3. Ensure LLM configuration is set

#### Performance Issues
**Problem**: Slow rendering with large code files
**Solution**:
1. Implement virtual scrolling
2. Use code pagination
3. Optimize Redux selectors

### Debug Mode
```typescript
// Enable debug logging
const DEBUG_MODE = process.env.NODE_ENV === 'development';

if (DEBUG_MODE) {
  console.log('CodeViewPage state:', { graphId, selectedNode, generatedCode });
}
```

## 📈 Future Enhancements

### Planned Features
1. **Code Comparison**: Diff viewer for code versions
2. **Batch Export**: Export all generated code at once
3. **Code Templates**: Predefined code templates
4. **Collaboration**: Real-time code collaboration
5. **Analytics**: Code generation analytics and insights

### Extension Points
- **Custom Code Displayers**: Pluggable code visualization
- **Additional Export Formats**: PDF, Word, etc.
- **Advanced Search**: Regex search and replace
- **Code Annotations**: Add notes to generated code

## 📚 API Reference

### CodePanel Props
```typescript
interface CodePanelProps {
  selectedNode: CanvasNode | null;
  graphId: string;
  showGeneratedCode?: boolean;
}
```

### GeneratedCodeDisplay Props
```typescript
interface GeneratedCodeDisplayProps {
  codes: string[];
  nodeId: string;
  nodeLabel: string;
  isLoading?: boolean;
  error?: string | null;
  onCopy?: (code: string) => void;
  onDownload?: (code: string, filename: string) => void;
  className?: string;
}
```

### CodeGenerationStatus Props
```typescript
interface CodeGenerationStatusProps {
  graphId: string;
  className?: string;
}
```

## 🎯 Best Practices

### Do's
- ✅ Use proper TypeScript types
- ✅ Handle loading and error states
- ✅ Provide user feedback for all actions
- ✅ Test with different screen sizes
- ✅ Optimize Redux selectors

### Don'ts
- ❌ Hard-code graph IDs
- ❌ Ignore error states
- ❌ Skip loading indicators
- ❌ Use inline styles excessively
- ❌ Forget to clean up side effects

---

## 📝 Migration Guide

### From Basic CodeViewPage
```typescript
// Before
<CodeViewPage isSidebarCollapsed={false} />

// After
<CodeViewPage 
  isSidebarCollapsed={false}
  showGeneratedCode={true}
/>
```

### Adding Custom Features
```typescript
// Extend with custom props
interface EnhancedCodeViewPageProps extends CodeViewPageProps {
  customFeature?: boolean;
  onCustomAction?: () => void;
}

const EnhancedCodeViewPage: React.FC<EnhancedCodeViewPageProps> = ({
  customFeature,
  onCustomAction,
  ...props
}) => {
  return (
    <CodeViewPage {...props}>
      {customFeature && (
        <CustomFeature onAction={onCustomAction} />
      )}
    </CodeViewPage>
  );
};
```

---

**Last Updated**: 2026-02-06  
**Version**: 2.0.0  
**Maintainer**: KUBEGRAM UI Team