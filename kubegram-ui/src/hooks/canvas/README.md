# Konva Canvas Hooks

This directory contains React hooks for managing Konva canvas interactions, including element drops, deletions, and arrow attachments.

## Hooks Overview

### 1. `useKonvaElementDrop`
Handles drag and drop events for adding new nodes to the canvas.

**Features:**
- Drag and drop event handling
- Screen to canvas coordinate conversion
- Node creation with proper positioning
- Error handling for invalid drop data

**Usage:**
```typescript
const { handleDragOver, handleDrop, convertToCanvasCoordinates } = useKonvaElementDrop(
  (node) => {
    // Handle new node creation
    setNodes(prev => [...prev, node]);
  },
  (error) => {
    // Handle drop errors
    console.error('Drop error:', error);
  }
);
```

### 2. `useKonvaElementDeletion`
Manages element deletion operations on the canvas.

**Features:**
- Delete selected nodes and arrows
- Clean up connected arrows when nodes are deleted
- Bulk deletion operations
- Individual element deletion
- Clear all elements

**Usage:**
```typescript
const { 
  deleteSelectedItems, 
  deleteNodeById, 
  deleteArrowById,
  clearAllElements 
} = useKonvaElementDeletion(
  (deletedNodes, deletedArrows) => {
    // Handle deletion
    setNodes(prev => prev.filter(node => !deletedNodes.includes(node.id)));
    setArrows(prev => prev.filter(arrow => !deletedArrows.includes(arrow.id)));
  },
  (error) => {
    console.error('Deletion error:', error);
  }
);
```

### 3. `useKonvaArrowAttachment`
Handles arrow creation and attachment to nodes.

**Features:**
- Attach arrows to nodes at connection points
- Calculate proper edge connection points
- Create arrows between nodes
- Create arrows from/to points
- Detach arrows from nodes
- Find nearest nodes for attachment

**Usage:**
```typescript
const {
  attachArrowStart,
  attachArrowEnd,
  createArrowBetweenNodes,
  findNearestNode
} = useKonvaArrowAttachment(
  (event) => {
    // Handle arrow attachment
    console.log('Arrow attached:', event);
  },
  (arrowId, nodeId, type) => {
    // Handle arrow detachment
    console.log('Arrow detached:', { arrowId, nodeId, type });
  },
  (arrow) => {
    // Handle arrow creation
    setArrows(prev => [...prev, arrow]);
  }
);
```

### 4. `useKonvaCanvasEvents` (Combined Hook)
A unified hook that combines all three functionalities for easy use.

**Features:**
- All functionality from individual hooks
- Unified interface for canvas events
- Additional logging and error handling
- Direct access to individual hooks for advanced usage

**Usage:**
```typescript
const canvasEvents = useKonvaCanvasEvents(
  // Element drop callbacks
  (node) => setNodes(prev => [...prev, node]),
  (error) => console.error('Drop error:', error),
  
  // Element deletion callbacks
  (deletedNodes, deletedArrows) => {
    setNodes(prev => prev.filter(node => !deletedNodes.includes(node.id)));
    setArrows(prev => prev.filter(arrow => !deletedArrows.includes(arrow.id)));
  },
  (error) => console.error('Deletion error:', error),
  
  // Arrow attachment callbacks
  (event) => console.log('Arrow attached:', event),
  (arrowId, nodeId, type) => console.log('Arrow detached:', { arrowId, nodeId, type }),
  (arrow) => setArrows(prev => [...prev, arrow]),
  (error) => console.error('Attachment error:', error)
);

// Use in your component
<div 
  onDragOver={canvasEvents.handleDragOver}
  onDrop={canvasEvents.handleDrop}
>
  {/* Canvas content */}
</div>
```

## Integration with KonvaCanvas

Here's how to integrate these hooks with your existing KonvaCanvas component:

```typescript
import { useKonvaCanvasEvents, type CanvasNode, type CanvasArrow } from '../hooks/canvas';

const KonvaCanvas = () => {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [arrows, setArrows] = useState<CanvasArrow[]>([]);
  const [selectedItems, setSelectedItems] = useState({ nodes: [], arrows: [] });

  const canvasEvents = useKonvaCanvasEvents(
    // Handle element drops
    (newNode) => {
      setNodes(prev => [...prev, newNode]);
      console.log('Element dropped:', newNode);
    },
    
    // Handle element deletions
    (deletedNodes, deletedArrows) => {
      setNodes(prev => prev.filter(node => !deletedNodes.includes(node.id)));
      setArrows(prev => prev.filter(arrow => !deletedArrows.includes(arrow.id)));
      setSelectedItems({ nodes: [], arrows: [] });
      console.log('Elements deleted:', { deletedNodes, deletedArrows });
    },
    
    // Handle arrow attachments
    (event) => {
      console.log('Arrow attached:', event);
      // Update arrow positions based on attachment
    },
    
    // Handle arrow detachments
    (arrowId, nodeId, type) => {
      console.log('Arrow detached:', { arrowId, nodeId, type });
      // Update arrow state
    },
    
    // Handle arrow creation
    (newArrow) => {
      setArrows(prev => [...prev, newArrow]);
      console.log('Arrow created:', newArrow);
    }
  );

  // Handle keyboard shortcuts for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        canvasEvents.deleteSelectedItems(selectedItems, nodes, arrows);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems, nodes, arrows, canvasEvents]);

  return (
    <div 
      onDragOver={canvasEvents.handleDragOver}
      onDrop={canvasEvents.handleDrop}
    >
      {/* Your Konva Stage and Layer components */}
    </div>
  );
};
```

## Event Callbacks

### Element Drop Events
- `onElementDropped`: Called when a new element is dropped on the canvas
- `onDropError`: Called when a drop operation fails

### Element Deletion Events
- `onElementsDeleted`: Called when elements are deleted (receives arrays of deleted IDs)
- `onDeletionError`: Called when a deletion operation fails

### Arrow Attachment Events
- `onArrowAttached`: Called when an arrow is attached to a node
- `onArrowDetached`: Called when an arrow is detached from a node
- `onArrowCreated`: Called when a new arrow is created
- `onAttachmentError`: Called when an attachment operation fails

## Types

The hooks export several TypeScript interfaces:

- `CanvasNode`: Interface for canvas nodes
- `CanvasArrow`: Interface for canvas arrows
- `SelectedItems`: Interface for selected items state
- `ArrowAttachmentEvent`: Interface for arrow attachment events

## Error Handling

All hooks include comprehensive error handling with optional error callbacks. Errors are logged to the console and passed to the error callback if provided.

## Performance Considerations

- All callbacks are memoized using `useCallback` to prevent unnecessary re-renders
- Coordinate calculations are optimized for performance
- Event handlers are designed to be efficient and avoid memory leaks