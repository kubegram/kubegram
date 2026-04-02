import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import DraggableNode from './DraggableNode';
import Arrow from './Arrow';

import CanvasBackground from './CanvasBackground';
import CanvasSelection from './CanvasSelection';
import CanvasNavigation from './CanvasNavigation';
import CanvasArrowDrawing from './CanvasArrowDrawing';
import CanvasGroupMovement from './CanvasGroupMovement';
import CanvasContextMenu from './CanvasContextMenu';

import { useCanvasScroll } from '@/hooks/canvas/useCanvasScroll';
import { useKonvaElementDeletion } from '@/hooks/canvas/useKonvaElementDeletion';
import { useJsonCanvasEvents } from '@/hooks/canvas/useJsonCanvasEvents';
import type { JsonCanvasStateReturn } from '@/hooks/canvas/useJsonCanvasState';

import type { TextNode } from '@/types/jsoncanvas';
import type { CanvasNode } from '@/types/canvas';

export interface JsonCanvasEditorProps {
  isSidebarCollapsed?: boolean;
  isHeaderCollapsed?: boolean;
  state: JsonCanvasStateReturn;
}

const JsonCanvasEditor: React.FC<JsonCanvasEditorProps> = ({
  isSidebarCollapsed = false,
  isHeaderCollapsed = false,
  state,
}) => {
  const stageRef = useRef<Konva.Stage>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);
  const { scrollContainerRef } = useCanvasScroll({ stageRef });

  // Destructure state (owned by parent page)
  const {
    nodes,
    arrows,
    isArrowMode,
    setIsArrowMode,
    isSquareArrowMode,
    isCurvedArrowMode,
    isDrawingArrow,
    arrowStart,
    tempArrowEnd,
    arrowSnapTarget,
    selectedItems,
    isSelecting,
    selectionRect,
    isGroupMoving,
    groupMoveStart,
    groupMoveOffset,
    contextMenu,
    dragItem,
    renamingNodeId,
    showBackToContent,
    setShowBackToContent,
    setDragItem,
    setRenamingNodeId,
    setContextMenu,
    setSelectedItems,
    clearSelection,
    removeNode,
    removeEdge,
    updateRenderNode,
    updateArrowCoords,
    updateArrowAttachment,
    addNode,
  } = state;

  // Events
  const events = useJsonCanvasEvents(stageRef, state, isSidebarCollapsed, isHeaderCollapsed);
  const {
    handleArrowCanvasClick,
    handleArrowNodeClick,
    handleArrowMouseMove,
    handleGroupMouseDown,
    handleGroupMouseMoveSelection,
    handleGroupMouseUp,
    handleGroupMoveEnd,
    handleCanvasPanStart,
    handleCanvasPanMove,
    handleCanvasPanEnd,
    handleBackToContent,
    handleCanvasRightClick,
    getArrowClickCoordinates,
    findElementsByCoordinates,
    justFinishedSelectionRef,
    handleCopySelected,
    handlePasteFromClipboard,
  } = events;

  // Canvas view state
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const updateBackToContent = useCallback((pos: { x: number; y: number }, scale: number) => {
    const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2);
    console.log('dfddfd');
    console.log('📏 Distance from origin:', distance.toFixed(2), 'Scale:', scale.toFixed(2));
    console.log()
    setShowBackToContent(distance > 300 || scale < 0.6 || scale > 3);
  }, [setShowBackToContent]);

  // Panning is driven by the scroll container (useCanvasScroll), not stagePos.
  // Listen to its scroll event to detect when the user has moved far from origin.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const pos = { x: -container.scrollLeft, y: -container.scrollTop };
      updateBackToContent(pos, stageScale);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [scrollContainerRef, stageScale, updateBackToContent]);


  // Sync React state back to origin after the 500ms tween completes, then hide the button.
  const handleBackToContentWithSync = useCallback(() => {
    handleBackToContent();
    setTimeout(() => {
      setStagePos({ x: 0, y: 0 });
      setStageScale(1);
    }, 510);
  }, [handleBackToContent]);

  const CANVAS_SIZE = 5000;
  const PADDING = 500;

  // --- Deletion ---
  const handleElementsDeleted = useCallback(
    (deletedNodes: string[], deletedArrows: string[]) => {
      // First delete all the nodes
      deletedNodes.forEach((id) => removeNode(id));
      
      // Then delete all the arrows (including those connected to deleted nodes)
      // The useKonvaElementDeletion hook already handles finding connected arrows
      deletedArrows.forEach((id) => removeEdge(id));
      
      clearSelection();
    },
    [removeNode, removeEdge, clearSelection],
  );

  const { deleteSelectedItems } = useKonvaElementDeletion(handleElementsDeleted);

  // --- Node drag handlers ---
  const handleNodeDragStart = useCallback((nodeId: string) => {
    if (isGroupMoving) return;

    if (selectedItems.nodes.includes(nodeId) && selectedItems.nodes.length > 1) {
      state.setIsGroupMoving(true);
      state.setGroupMoveStart({ x: 0, y: 0 });
      state.setGroupMoveOffset({ x: 0, y: 0 });
      return;
    }

    setDragItem(nodes.find((n) => n.id === nodeId) || null);
  }, [isGroupMoving, selectedItems, nodes, setDragItem, state]);

  const handleNodeDragMove = useCallback((nodeId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const newX = e.target.x();
    const newY = e.target.y();

    if (isGroupMoving && selectedItems.nodes.includes(nodeId)) {
      if (groupMoveStart && groupMoveStart.x === 0 && groupMoveStart.y === 0) {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) state.setGroupMoveStart({ x: node.x, y: node.y });
      }
      if (groupMoveStart && groupMoveStart.x !== 0 && groupMoveStart.y !== 0) {
        state.setGroupMoveOffset({ x: newX - groupMoveStart.x, y: newY - groupMoveStart.y });
      }
      return;
    }
  }, [isGroupMoving, selectedItems, groupMoveStart, nodes, state]);

  const handleNodeDragEnd = useCallback((nodeId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    if (isGroupMoving) {
      handleGroupMoveEnd();
      return;
    }

    const newX = e.target.x();
    const newY = e.target.y();
    updateRenderNode(nodeId, { x: newX, y: newY });
    setDragItem(null);
  }, [isGroupMoving, handleGroupMoveEnd, updateRenderNode, setDragItem]);

  // --- Node resize ---
  const handleNodeResize = useCallback((nodeId: string, width: number, height: number) => {
    updateRenderNode(nodeId, { width, height });
  }, [updateRenderNode]);

  // --- Node selection ---
  // desiredSelected = the NEW state the node wants (true = select me, false = deselect me)
  // DraggableNode passes !isSelected (inverted current state) as this argument
  const handleNodeSelect = useCallback((
    nodeId: string,
    desiredSelected: boolean,
    isCtrlKey: boolean,
    isShiftKey: boolean
  ) => {
    // A rect-select just finished — don't let the trailing click event override it
    if (justFinishedSelectionRef.current) {
      justFinishedSelectionRef.current = false;
      return;
    }

    if (isCtrlKey) {
      // CTRL+CLICK: desiredSelected=true → add to selection, false → remove
      setSelectedItems({
        ...selectedItems,
        nodes: desiredSelected
          ? [...selectedItems.nodes, nodeId]
          : selectedItems.nodes.filter((id) => id !== nodeId),
      });
    } else if (isShiftKey && selectedItems.nodes.length > 0) {
      // SHIFT+CLICK: Range selection - select all nodes between first selected and clicked
      const firstSelectedIndex = nodes.findIndex(n => n.id === selectedItems.nodes[0]);
      const clickedIndex = nodes.findIndex(n => n.id === nodeId);

      if (firstSelectedIndex !== -1 && clickedIndex !== -1) {
        const start = Math.min(firstSelectedIndex, clickedIndex);
        const end = Math.max(firstSelectedIndex, clickedIndex);
        const rangeNodeIds = nodes.slice(start, end + 1).map(n => n.id);
        setSelectedItems({
          ...selectedItems,
          nodes: [...new Set([...selectedItems.nodes, ...rangeNodeIds])],
        });
      }
    } else {
      // REGULAR CLICK: Select only this node (no-op if already the sole selection)
      if (selectedItems.nodes.length === 1 && selectedItems.nodes[0] === nodeId) return;
      setSelectedItems({ nodes: [nodeId], arrows: [] });
    }
  }, [justFinishedSelectionRef, selectedItems, setSelectedItems, nodes]);

  // --- Arrow selection ---
  const handleArrowSelect = useCallback((arrowId: string, isSelected: boolean) => {
    setSelectedItems({
      ...selectedItems,
      arrows: isSelected
        ? [...selectedItems.arrows, arrowId]
        : selectedItems.arrows.filter((id) => id !== arrowId),
    });
  }, [selectedItems, setSelectedItems]);

  // Disable arrow mode when multiple nodes are selected
  useEffect(() => {
    if (selectedItems.nodes.length > 1 && isArrowMode) {
      console.log('📝 Disabling arrow mode due to multi-selection');
      setIsArrowMode(false);
    }
  }, [selectedItems.nodes.length, isArrowMode, setIsArrowMode]);

  // --- Delete handlers ---
  const handleDeleteNode = useCallback((nodeId: string) => {
    removeNode(nodeId);
    setSelectedItems({
      ...selectedItems,
      nodes: selectedItems.nodes.filter((id) => id !== nodeId),
    });
  }, [removeNode, selectedItems, setSelectedItems]);

  const handleDeleteArrow = useCallback((arrowId: string) => {
    removeEdge(arrowId);
    setSelectedItems({
      ...selectedItems,
      arrows: selectedItems.arrows.filter((id) => id !== arrowId),
    });
  }, [removeEdge, selectedItems, setSelectedItems]);

  // --- Arrow endpoint drag handlers ---
  const handleArrowStartPointMove = useCallback((arrowId: string, x: number, y: number) => {
    updateArrowCoords(arrowId, { startX: x, startY: y });
  }, [updateArrowCoords]);

  const handleArrowEndPointMove = useCallback((arrowId: string, x: number, y: number) => {
    updateArrowCoords(arrowId, { endX: x, endY: y });
  }, [updateArrowCoords]);

  const handleArrowStartPointAttach = useCallback((arrowId: string, nodeId: string) => {
    updateArrowAttachment(arrowId, 'start', nodeId);
  }, [updateArrowAttachment]);

  const handleArrowEndPointAttach = useCallback((arrowId: string, nodeId: string) => {
    updateArrowAttachment(arrowId, 'end', nodeId);
  }, [updateArrowAttachment]);

  const handleContextMenuDelete = useCallback(() => {
    if (contextMenu.type === 'node') handleDeleteNode(contextMenu.id!);
    else if (contextMenu.type === 'arrow') handleDeleteArrow(contextMenu.id!);
    setContextMenu({ x: 0, y: 0, type: null, id: null });
  }, [contextMenu, handleDeleteNode, handleDeleteArrow, setContextMenu]);

  // --- Zoom ---
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.1;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(0.1, Math.min(newScale, 5));
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStageScale(newScale);
    setStagePos(newPos);
    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    updateBackToContent(newPos, newScale);
  }, [updateBackToContent]);

  // --- Drag bound ---
  const dragBoundFunc = useCallback((pos: { x: number; y: number }) => {
    const stage = stageRef.current;
    if (!stage) return pos;
    const scale = stage.scaleX();
    const w = stage.width();
    const h = stage.height();
    const xMin = w - CANVAS_SIZE * scale - PADDING * scale;
    const xMax = PADDING * scale;
    const yMin = h - CANVAS_SIZE * scale - PADDING * scale;
    const yMax = PADDING * scale;
    return {
      x: Math.min(Math.max(pos.x, xMin), xMax),
      y: Math.min(Math.max(pos.y, yMin), yMax),
    };
  }, []);

  // Convert toolbar icon path to canvas icon path
  const getCanvasIconPath = (resourceName: string, dragIconPath?: string): string => {
    // The toolbar already provides the correct icon path — use it directly
    if (dragIconPath && dragIconPath.startsWith('/')) {
      return dragIconPath;
    }
    // Fallback: map by resource name (used when no direct path is available)
    return iconMap[resourceName] || iconMap[resourceName.replace(/ /g, '')] || `/kubernetes/resources/unlabeled/pod.svg`;
  };

  // Icon path mapping for toolbar items
  const iconMap: Record<string, string> = {
    // Legacy/Toolbar mappings
    'logger': '/kubernetes/resources/unlabeled/pod.svg',
    'secret': '/kubernetes/resources/unlabeled/secret.svg',
    'monitor': '/kubernetes/resources/unlabeled/pod.svg',
    'service': '/kubernetes/resources/unlabeled/svc.svg',
    'config': '/kubernetes/resources/unlabeled/cm.svg',
    'lb': '/kubernetes/resources/unlabeled/svc.svg',
    'LoadBalancer': '/kubernetes/resources/unlabeled/svc.svg',
    'nginx': '/kubernetes/resources/unlabeled/pod.svg',
    'linkerd': '/kubernetes/resources/unlabeled/pod.svg',
    'traefik': '/kubernetes/resources/unlabeled/pod.svg',
    // Kubernetes resources
    'Pod': '/kubernetes/resources/unlabeled/pod.svg',
    'Service': '/kubernetes/resources/unlabeled/svc.svg',
    'Namespace': '/kubernetes/resources/unlabeled/ns.svg',
    'Node': '/kubernetes/resources/unlabeled/node.svg',
    'ConfigMap': '/kubernetes/resources/unlabeled/cm.svg',
    'Secret': '/kubernetes/resources/unlabeled/secret.svg',
    'Deployment': '/kubernetes/resources/unlabeled/deploy.svg',
    'StatefulSet': '/kubernetes/resources/unlabeled/sts.svg',
    'DaemonSet': '/kubernetes/resources/unlabeled/ds.svg',
    'Job': '/kubernetes/resources/unlabeled/job.svg',
    'CronJob': '/kubernetes/resources/unlabeled/cronjob.svg',
    'Ingress': '/kubernetes/resources/unlabeled/ing.svg',
  };

  // --- Drop from toolbar ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('node-type');
    const nodeLabel = e.dataTransfer.getData('node-label');
    const nodeIcon = e.dataTransfer.getData('node-icon');

    if (nodeType && nodeLabel) {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.container().getBoundingClientRect();
      const scale = stage.scaleX();
      const pos = stage.position();
      const canvasX = (e.clientX - rect.left - pos.x) / scale;
      const canvasY = (e.clientY - rect.top - pos.y) / scale;

      // Map the icon path correctly
      const mappedIcon = getCanvasIconPath(nodeType, nodeIcon);

      const newNode: TextNode = {
        id: `${nodeType}-${Date.now()}`,
        type: 'text',
        x: Math.round(canvasX - 40),
        y: Math.round(canvasY - 30),
        width: 100,
        height: 100,
        text: `---\nk8s-type: ${nodeType}\nicon: ${mappedIcon}\nnodeType: ${nodeType.toUpperCase()}\n---\n${nodeLabel}`,
      };

      addNode(newNode);
      setRenamingNodeId(newNode.id);
    }
  };

  // --- Konva native event listeners ---
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
      handleArrowMouseMove(e);
      handleGroupMouseMoveSelection(e);
      handleCanvasPanMove(e);
    };
    const onMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      handleCanvasPanStart(e);
      handleGroupMouseDown(e, isArrowMode);
    };
    const onMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (dragItem) {
        const stageInst = e.target.getStage();
        if (stageInst) {
          const draggedNode = stageInst.findOne(`#${dragItem.id}`);
          const syntheticEvent = {
            target: {
              x: () => draggedNode ? draggedNode.x() : dragItem.x,
              y: () => draggedNode ? draggedNode.y() : dragItem.y,
            },
            evt: e.evt,
          } as Konva.KonvaEventObject<DragEvent>;
          handleNodeDragEnd(dragItem.id, syntheticEvent);
        }
      }
      handleGroupMouseUp();
      handleCanvasPanEnd();
    };
    const onClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
      handleArrowCanvasClick(e);
    };
    const onContextMenu = (e: Konva.KonvaEventObject<MouseEvent>) => {
      handleCanvasRightClick(e as unknown as Konva.KonvaEventObject<PointerEvent>);
    };

    stage.on('mousemove', onMouseMove);
    stage.on('mousedown', onMouseDown);
    stage.on('mouseup', onMouseUp);
    stage.on('click', onClick);
    stage.on('contextmenu', onContextMenu);

    return () => {
      stage.off('mousemove', onMouseMove);
      stage.off('mousedown', onMouseDown);
      stage.off('mouseup', onMouseUp);
      stage.off('click', onClick);
      stage.off('contextmenu', onContextMenu);
    };
  }, [stageRef, handleArrowMouseMove, handleGroupMouseMoveSelection, handleCanvasPanMove,
    handleCanvasPanStart, handleGroupMouseDown, isArrowMode, dragItem, handleNodeDragEnd,
    handleGroupMouseUp, handleCanvasPanEnd, handleArrowCanvasClick, handleCanvasRightClick]);

  // Keyboard delete handler
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      console.log('⌨️ Keyboard event:', { key: e.key, activeElement: document.activeElement?.tagName });
      
      // Don't delete if focused on input/textarea
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
        console.log('⌨️ Skipping delete - focused on input');
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const hasSelection = selectedItems.nodes.length > 0 || selectedItems.arrows.length > 0;
        console.log('⌨️ Delete key pressed:', { 
          hasSelection, 
          selectedNodes: selectedItems.nodes, 
          selectedArrows: selectedItems.arrows,
          nodesCount: nodes.length,
          arrowsCount: arrows.length,
          isArrowMode 
        });
        
        if (hasSelection) {
          e.preventDefault();
          console.log('🗑️ Calling deleteSelectedItems...');
          deleteSelectedItems(selectedItems, nodes as any, arrows as any);
        } else {
          console.log('⌨️ No items selected to delete');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedItems, nodes, arrows, deleteSelectedItems, isArrowMode]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative z-10 outline-none"
      style={{ height: '100%', minHeight: '100%' }}
      tabIndex={0}
      onClick={() => containerRef.current?.focus()}
    >
      <div
        ref={scrollContainerRef}
        className="overflow-auto relative"
        style={{ width: '100%', height: '100%' }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }} />
        <Stage
          ref={stageRef}
          width={window.innerWidth}
          height={window.innerHeight}
          style={{ cursor: 'crosshair', display: 'block', position: 'absolute', top: 0, left: 0 }}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          draggable={!isSelecting && !isDrawingArrow && !isGroupMoving}
          dragBoundFunc={dragBoundFunc}
          onWheel={handleWheel}
          onDragMove={(e) => {
            if (e.target === stageRef.current) {
              const pos = e.target.position();
              setStagePos(pos);
              updateBackToContent(pos, stageScale);
            }
          }}
          onDragEnd={(e) => {
            if (e.target === stageRef.current) {
              const pos = e.target.position();
              setStagePos(pos);
              updateBackToContent(pos, stageScale);
            }
          }}
        >
          <Layer>
            <CanvasBackground />

            {/* Nodes */}
            {nodes.map((node) => (
              <DraggableNode
                key={node.id}
                id={node.id}
                iconSrc={node.iconSrc}
                nodeType={node.type}
                label={node.label}
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                isDragging={dragItem?.id === node.id}
                isArrowMode={isArrowMode}
                isSelected={selectedItems.nodes.includes(node.id)}
                isMultiSelected={selectedItems.nodes.length > 1}
                selectedCount={selectedItems.nodes.length}
                isSnapTarget={arrowSnapTarget === node.id}
                color={node.color}
                showSelectionHandles={selectedItems.nodes.includes(node.id)}
                onDragStart={() => handleNodeDragStart(node.id)}
                onDragMove={(e) => handleNodeDragMove(node.id, e)}
                onDragEnd={(e) => handleNodeDragEnd(node.id, e)}
                onResize={(w, h) => handleNodeResize(node.id, w, h)}
                onClick={(nodeId, x, y) => handleArrowNodeClick(nodeId, x, y)}
                onSelect={(nodeId, isSelected, isCtrlKey, isShiftKey) => handleNodeSelect(nodeId, isSelected, isCtrlKey, isShiftKey)}
                onDblClick={(nodeId) => setRenamingNodeId(nodeId)}
                onRightClick={(nodeId, x, y) => {
                  setContextMenu({ x, y, type: 'node', id: nodeId });
                }}
              />
            ))}

            {/* Arrows */}
            {arrows.map((arrow) => (
              <Arrow
                key={arrow.id}
                id={arrow.id}
                startX={arrow.startX}
                startY={arrow.startY}
                endX={arrow.endX}
                endY={arrow.endY}
                isSelected={selectedItems.arrows.includes(arrow.id)}
                isMultiSelected={selectedItems.arrows.length > 1 && selectedItems.arrows.includes(arrow.id)}
                isSquareArrow={arrow.pathMode === 'square'}
                isCurvedArrow={arrow.pathMode === 'curved'}
                startNodeId={arrow.startNodeId}
                endNodeId={arrow.endNodeId}
                nodes={nodes as unknown as CanvasNode[]}
                isFlowAnimated={state.isFlowAnimated}
                isPulsing={state.isPulsing}
                animateIn={state.animatingArrowIds.has(arrow.id)}
                onAnimateInComplete={() => state.clearAnimatingArrow(arrow.id)}
                onStartPointMove={(x, y) => handleArrowStartPointMove(arrow.id, x, y)}
                onEndPointMove={(x, y) => handleArrowEndPointMove(arrow.id, x, y)}
                onStartPointAttach={(nodeId) => handleArrowStartPointAttach(arrow.id, nodeId)}
                onEndPointAttach={(nodeId) => handleArrowEndPointAttach(arrow.id, nodeId)}
                onSelect={(isSelected) => handleArrowSelect(arrow.id, isSelected)}
                onRightClick={(arrowId, x, y) => {
                  setContextMenu({ x, y, type: 'arrow', id: arrowId });
                }}
                onGetClickCoordinates={(e) => getArrowClickCoordinates(e, stageRef)}
                onFindElementsByCoordinates={(x, y, threshold) =>
                  findElementsByCoordinates(x, y, nodes as unknown as CanvasNode[], arrows as any, threshold)
                }
              />
            ))}

            {/* Temp arrow preview */}
            <CanvasArrowDrawing
              isDrawingArrow={isDrawingArrow}
              arrowStart={arrowStart}
              tempArrowEnd={tempArrowEnd}
              isSquareArrowMode={isSquareArrowMode}
              isCurvedArrowMode={isCurvedArrowMode}
              nodes={nodes as unknown as CanvasNode[]}
              isSnapped={!!arrowSnapTarget}
              arrowSnapTarget={arrowSnapTarget}
            />

            {/* Selection rectangle */}
            <CanvasSelection 
              isSelecting={isSelecting} 
              selectionRect={selectionRect}
              selectedCount={selectedItems.nodes.length}
              showResizeHandles={selectedItems.nodes.length > 1}
              showSelectionBadge={selectedItems.nodes.length > 1}
            />

            {/* Group movement preview */}
            <CanvasGroupMovement
              isGroupMoving={isGroupMoving}
              groupMoveOffset={groupMoveOffset}
              selectedNodes={selectedItems.nodes}
              nodes={nodes as unknown as CanvasNode[]}
            />

            {/* Context menu */}
            <CanvasContextMenu
              contextMenu={contextMenu}
              onDelete={handleContextMenuDelete}
              selectedCount={selectedItems.nodes.length + selectedItems.arrows.length}
              onCopy={handleCopySelected}
              onDuplicate={() => { handleCopySelected(); handlePasteFromClipboard(); }}
            />
          </Layer>
        </Stage>
      </div>

      {/* Back to Content Button — rendered after scroll container so it's not buried by overflow stacking context */}
      <CanvasNavigation
        showBackToContent={showBackToContent}
        onBackToContent={handleBackToContentWithSync}
      />

      {/* Renaming overlay */}
      {renamingNodeId && (() => {
        const node = nodes.find((n) => n.id === renamingNodeId);
        if (!node || !stageRef.current) return null;
        const stage = stageRef.current;
        const absPos = {
          x: stage.x() + node.x * stage.scaleX(),
          y: stage.y() + node.y * stage.scaleX(),
        };
        const nodeW = node.width * stage.scaleX();
        const nodeH = node.height * stage.scaleX();

        return (
          <input
            autoFocus
            defaultValue={node.label}
            className="absolute z-50 text-center bg-transparent text-white focus:outline-none focus:ring-0"
            style={{
              top: absPos.y + nodeH - 25,
              left: absPos.x,
              width: nodeW,
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              padding: '2px',
              transform: 'translateY(-50%)',
            }}
            onBlur={(e) => {
              const newName = e.target.value;
              if (newName && newName !== node.label) {
                updateRenderNode(node.id, { label: newName, name: newName });
              }
              setRenamingNodeId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        );
      })()}
    </div>
  );
};

JsonCanvasEditor.displayName = 'JsonCanvasEditor';

export default JsonCanvasEditor;
// Test edit
