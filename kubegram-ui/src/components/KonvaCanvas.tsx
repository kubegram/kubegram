import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import DraggableNode from './DraggableNode';
import Arrow from './Arrow';

// New smaller components
import CanvasBackground from './CanvasBackground';
import CanvasSelection from './CanvasSelection';
import CanvasNavigation from './CanvasNavigation';
import CanvasArrowDrawing from './CanvasArrowDrawing';
import CanvasGroupMovement from './CanvasGroupMovement';
import CanvasContextMenu from './CanvasContextMenu';
import CanvasDeleteButtons from './CanvasDeleteButtons';
import CanvasAIAssistant from './CanvasAIAssistant';

// Custom hooks
import { useCanvasEvents } from '@/hooks/canvas/useCanvasEvents';
import { useCanvasCoordinates } from '@/hooks/canvas/useCanvasCoordinates';
import { useArrowDrawing } from '@/hooks/canvas/useArrowDrawing';
import { useGroupSelection } from '@/hooks/canvas/useGroupSelection';
import { useKonvaElementDeletion } from '@/hooks/canvas/useKonvaElementDeletion';
import { useCanvasScroll } from '@/hooks/canvas/useCanvasScroll';
import { useProjectSync } from '@/hooks/canvas/useProjectSync';
import { usePlanning } from '@/hooks/usePlanning';

// Redux
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  addNode,
  updateNode,
  removeNode,
  updateArrow,
  removeArrow,
  setSelectedItems,
  clearSelection,
  setContextMenu,
  setDragItem,
  setArrowMode,
  setSquareArrowMode,
  setCurvedArrowMode,
  setDrawingArrow,
  setArrowStart,
  setTempArrowEnd,
  setSelecting,
  setSelectionRect,
  setGroupMoving,
  setGroupMoveStart,
  setGroupMoveOffset,
  setRenamingNodeId,
} from '@/store/slices/canvas';
import { updateNodeInGraph } from '@/store/slices/project/projectSlice';

import { type CanvasNode, type CanvasGraph } from '@/types/canvas';

export interface KonvaCanvasRef {
  getStage: () => Konva.Stage | null;
}

/**
 * KonvaCanvas Component Props
 */
interface KonvaCanvasProps {
  isArrowMode?: boolean;
  isSquareArrowMode?: boolean;
  isCurvedArrowMode?: boolean;
  isSidebarCollapsed?: boolean;
  isHeaderCollapsed?: boolean;
  onNodeSelect?: (nodeId: string | null) => void;
  initialGraphData?: CanvasGraph | null;
  onGenerateCode?: () => void;
  generatedCode?: string | null;
  isGenerating?: boolean;
  error?: string | null;
  onClearCode?: () => void;
  enableSync?: boolean;
  currentGraph?: CanvasGraph | null;
}

/**
 * Refactored KonvaCanvas Component
 *
 * This component has been broken down into smaller, more manageable components:
 * - CanvasBackground: Background dots pattern
 * - CanvasSelection: Selection rectangle and group selection
 * - CanvasNavigation: Back-to-content button
 * - CanvasArrowDrawing: Temporary arrow preview
 * - CanvasFrameCreation: Temporary frame preview
 * - CanvasGroupMovement: Group movement preview
 * - CanvasContextMenu: Right-click context menu
 * - CanvasDeleteButtons: Delete buttons for selected elements
 *
 * Custom hooks handle:
 * - useCanvasEvents: Keyboard shortcuts, mouse wheel, panning
 * - useCanvasCoordinates: Coordinate utilities and element finding
 * - useArrowDrawing: Arrow drawing logic
 * - useGroupSelection: Group selection and movement
 * - useFrameCreation: Frame creation logic
 */
const KonvaCanvas = React.forwardRef<Konva.Stage, KonvaCanvasProps>(
  (
    {
      isArrowMode: propIsArrowMode = false,
      isSquareArrowMode: propIsSquareArrowMode = false,
      isCurvedArrowMode: propIsCurvedArrowMode = false,
      isSidebarCollapsed = false,
      isHeaderCollapsed = false,
      onNodeSelect,
      initialGraphData,
      onGenerateCode,
      generatedCode,
      isGenerating,
      error,
      currentGraph,
      // onClearCode, // TODO: Use this prop
      enableSync = true,
    },
    ref,
  ) => {
    const dispatch = useAppDispatch();
    const stageRef = useRef<Konva.Stage>(null!);
    const { scrollContainerRef } = useCanvasScroll({ stageRef });

    // Planning hook
    const { isPlanning, generatePlan } = usePlanning();

    // Get LLM config from Redux
    const selectedLlmProvider = useAppSelector((state) => state.canvas.entities.selectedLlmProvider);
    const selectedLlmModel = useAppSelector((state) => state.canvas.entities.selectedLlmModel);

    const autoScrollRef = useRef<{ rafId: number | null; vy: number }>({ rafId: null, vy: 0 });

    const startAutoScroll = useCallback(() => {
      if (autoScrollRef.current.rafId !== null) return;
      const tick = () => {
        const container = scrollContainerRef.current;
        if (!container) {
          autoScrollRef.current.rafId = null;
          return;
        }
        const vy = autoScrollRef.current.vy;
        if (vy !== 0) {
          container.scrollTop += vy;
          autoScrollRef.current.rafId = requestAnimationFrame(tick);
        } else {
          autoScrollRef.current.rafId = null;
        }
      };
      autoScrollRef.current.rafId = requestAnimationFrame(tick);
    }, []);

    const stopAutoScroll = useCallback(() => {
      if (autoScrollRef.current.rafId !== null) {
        cancelAnimationFrame(autoScrollRef.current.rafId);
        autoScrollRef.current.rafId = null;
      }
      autoScrollRef.current.vy = 0;
    }, []);

    const updateAutoScrollFromClient = useCallback((clientY: number | undefined) => {
      const container = scrollContainerRef.current;
      if (!container || clientY == null) {
        stopAutoScroll();
        return;
      }
      const rect = container.getBoundingClientRect();
      const threshold = 64; // px from top/bottom to start scrolling
      const maxSpeed = 20; // px per frame
      let vy = 0;
      if (clientY < rect.top + threshold) {
        const t = Math.min(1, (rect.top + threshold - clientY) / threshold);
        vy = -Math.round(maxSpeed * t);
      } else if (clientY > rect.bottom - threshold) {
        const t = Math.min(1, (clientY - (rect.bottom - threshold)) / threshold);
        vy = Math.round(maxSpeed * t);
      }
      autoScrollRef.current.vy = vy;
      if (vy !== 0) {
        startAutoScroll();
      } else {
        stopAutoScroll();
      }
    }, [scrollContainerRef, startAutoScroll, stopAutoScroll]);

    // Forward ref to parent component
    React.useImperativeHandle(ref, () => stageRef.current!);

    // Get state from Redux store
    const dimensions = useAppSelector((state) => state.canvas.configs.dimensions);
    const canvasSize = useAppSelector((state) => state.canvas.configs.canvasSize);
    // Get state from Redux store, but prioritize initialGraphData if provided
    // const dimensions = useAppSelector((state) => state.canvas.configs.dimensions);
    // const canvasSize = useAppSelector((state) => state.canvas.configs.canvasSize);

    // Determine which data source to use
    const reduxNodes = useAppSelector((state) => state.canvas.data.canvasElementsLookup.nodes);
    const reduxArrows = useAppSelector((state) => state.canvas.data.canvasElementsLookup.arrows);

    // Local state for independent mode (when initialGraphData is provided)
    const [localNodes, setLocalNodes] = useState<CanvasNode[]>([]);
    const [localArrows, setLocalArrows] = useState<any[]>([]);

    // Initialize local state from props
    useEffect(() => {
      if (initialGraphData) {
        const validNodes = initialGraphData.nodes
          ? (initialGraphData.nodes.filter((n) => n !== null && n !== undefined) as CanvasNode[])
          : [];

        const validArrows = initialGraphData.arrows
          ? (initialGraphData.arrows.filter((a) => a !== null && a !== undefined) as any[])
          : [];

        setLocalNodes(validNodes);
        setLocalArrows(validArrows);
      }
    }, [initialGraphData]);

    // Use local state if initialGraphData is provided, otherwise use Redux
    const isLocalMode = !!initialGraphData;
    const nodes = isLocalMode ? localNodes : reduxNodes;
    const arrows = isLocalMode ? localArrows : reduxArrows;

    console.log('🎨 KonvaCanvas Data Source:', {
      isLocalMode,
      initialGraphDataProvided: !!initialGraphData,
      localNodesCount: localNodes.length,
      reduxNodesCount: reduxNodes.length,
      activeNodesCount: nodes.length
    });

    // Sync canvas state to project persistence
    useProjectSync(nodes, arrows, enableSync);

    const dragItem = useAppSelector((state) => state.canvas.activity.dragItem);
    const selectedItems = useAppSelector((state) => state.canvas.activity.selectedItems);
    const contextMenu = useAppSelector((state) => state.canvas.activity.contextMenu);
    const isArrowMode = useAppSelector((state) => state.canvas.activity.isArrowMode);
    const isSquareArrowMode = useAppSelector((state) => state.canvas.activity.isSquareArrowMode);
    const isCurvedArrowMode = useAppSelector((state) => state.canvas.activity.isCurvedArrowMode);
    const isSelecting = useAppSelector((state) => state.canvas.activity.isSelecting);
    const selectionRect = useAppSelector((state) => state.canvas.activity.selectionRect);
    const isGroupMoving = useAppSelector((state) => state.canvas.activity.isGroupMoving);
    const groupMoveStart = useAppSelector((state) => state.canvas.activity.groupMoveStart);
    const groupMoveOffset = useAppSelector((state) => state.canvas.activity.groupMoveOffset);
    const showBackToContent = useAppSelector((state) => state.canvas.activity.showBackToContent);
    const arrowStart = useAppSelector((state) => state.canvas.activity.arrowStart);
    const isDrawingArrow = useAppSelector((state) => state.canvas.activity.isDrawingArrow);
    const tempArrowEnd = useAppSelector((state) => state.canvas.activity.tempArrowEnd);
    const arrowSnapTarget = useAppSelector((state) => state.canvas.activity.arrowSnapTarget);
    const renamingNodeId = useAppSelector((state) => state.canvas.activity.renamingNodeId);
    // Show a scroll-to-top button when scrolled down
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showAIPanel, setShowAIPanel] = useState(false);

    // Canvas View State
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

    const CANVAS_SIZE = 5000; // Virtual canvas size
    const PADDING = 500; // Padding to allow scrolling slightly past edges

    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const onScroll = () => {
        // Show when scrolled more than 20% or > 300px
        const h = container.scrollHeight - container.clientHeight;
        const ratio = h > 0 ? container.scrollTop / h : 0;
        setShowScrollTop(container.scrollTop > 300 || ratio > 0.2);
      };
      container.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return () => container.removeEventListener('scroll', onScroll);
    }, [scrollContainerRef]);

    const handleScrollToTop = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }, [scrollContainerRef]);



    // Delete selected items using the deletion hook
    const handleElementsDeleted = useCallback(
      (deletedNodes: string[], deletedArrows: string[]) => {
        if (isLocalMode) return; // Disable deletion in local mode for now

        // Delete nodes
        deletedNodes.forEach((nodeId) => dispatch(removeNode(nodeId)));

        // Delete arrows
        deletedArrows.forEach((arrowId) => dispatch(removeArrow(arrowId)));

        // Clear selection after deletion
        dispatch(clearSelection());
      },
      [dispatch, isLocalMode],
    );

    const { deleteSelectedItems } = useKonvaElementDeletion(handleElementsDeleted);

    // Abort current operation (arrow drawing, selection, etc.)
    const abortCurrentOperation = useCallback(() => {
      // Abort arrow drawing if in progress
      if (isDrawingArrow || arrowStart) {
        dispatch(setDrawingArrow(false));
        dispatch(setArrowStart(null));
        dispatch(setTempArrowEnd(null));
      }

      // Clear selection
      dispatch(clearSelection());

      // Clear any drag operations
      dispatch(setDragItem(null));

      // Clear group selection
      dispatch(setSelecting(false));
      dispatch(setSelectionRect(null));

      // Clear group movement
      dispatch(setGroupMoving(false));
      dispatch(setGroupMoveStart(null));
      dispatch(setGroupMoveOffset(null));
    }, [isDrawingArrow, arrowStart, dispatch]);

    // Custom hooks
    const {
      handleBackToContent,
      handleCanvasPanStart,
      handleCanvasPanMove,
      handleCanvasPanEnd,
      handleCanvasRightClick,
    } = useCanvasEvents(
      stageRef,
      isSidebarCollapsed,
      isHeaderCollapsed,
      () => {
        deleteSelectedItems(selectedItems, nodes, arrows);
      },
      abortCurrentOperation,
    );

    const { getArrowClickCoordinates, findElementsByCoordinates } = useCanvasCoordinates();

    const {
      handleCanvasClick: handleArrowCanvasClick,
      handleNodeClick: handleArrowNodeClick,
      handleCanvasMouseMove: handleArrowMouseMove,
    } = useArrowDrawing(stageRef);

    const {
      handleCanvasMouseDown: handleGroupMouseDown,
      handleCanvasMouseMoveSelection: handleGroupMouseMoveSelection,
      handleCanvasMouseUp: handleGroupMouseUp,
      handleGroupMoveEnd: originalHandleGroupMoveEnd,
    } = useGroupSelection();

    // Enhanced group move end handler
    const handleGroupMoveEnd = useCallback(() => {
      originalHandleGroupMoveEnd();

      // Clear drag item state
      dispatch(setDragItem(null));
    }, [originalHandleGroupMoveEnd, dispatch]);

    // Handle node drag end
    const handleNodeDragEnd = (nodeId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      // Stop any ongoing auto-scroll when drag ends
      stopAutoScroll();
      // If we're in group movement mode, end group movement
      if (isGroupMoving) {
        // Update arrow positions for all moved nodes
        selectedItems.nodes.forEach((movedNodeId) => {
          const movedNode = nodes.find((n) => n.id === movedNodeId);
          if (movedNode && groupMoveOffset) {
            const newX = movedNode.x + groupMoveOffset.x;
            const newY = movedNode.y + groupMoveOffset.y;
            updateArrowPositions(movedNodeId, newX, newY);
          }
        });

        handleGroupMoveEnd();
        return;
      }

      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        const newX = e.target.x();
        const newY = e.target.y();

        if (isLocalMode) {
          // Local Mode: Update local state
          setLocalNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x: newX, y: newY } : n));
          updateArrowPositions(nodeId, newX, newY);
        } else {
          // Redux Mode: Dispatch action
          // Update the node position
          dispatch(updateNode({ id: nodeId, updates: { x: newX, y: newY } }));
          // Update arrow positions
          updateArrowPositions(nodeId, newX, newY);
        }
      }
      dispatch(setDragItem(null));
    };

    // Attach Konva-native pointer listeners to avoid React synthetic event overhead during scroll
    useEffect(() => {
      const stage = stageRef.current;
      if (!stage) return;

      const onMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        handleArrowMouseMove(e);
        handleGroupMouseMoveSelection(e);
        handleCanvasPanMove(e as unknown as Konva.KonvaEventObject<MouseEvent>);
      };
      const onMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        handleCanvasPanStart(e as unknown as Konva.KonvaEventObject<MouseEvent>);
        handleGroupMouseDown(e, isArrowMode);
      };
      const onMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (dragItem) {
          const stageInst = e.target.getStage();
          if (stageInst) {
            const draggedNode = stageInst.findOne(`#${dragItem.id}`);
            if (draggedNode) {
              const currentX = draggedNode.x();
              const currentY = draggedNode.y();
              const syntheticEvent = {
                target: {
                  x: () => currentX,
                  y: () => currentY,
                },
                evt: e.evt,
              } as Konva.KonvaEventObject<DragEvent>;
              handleNodeDragEnd(dragItem.id, syntheticEvent);
            } else {
              const syntheticEvent = {
                target: {
                  x: () => dragItem.x,
                  y: () => dragItem.y,
                },
                evt: e.evt,
              } as Konva.KonvaEventObject<DragEvent>;
              handleNodeDragEnd(dragItem.id, syntheticEvent);
            }
          }
        }

        handleGroupMouseUp();
        handleCanvasPanEnd();
      };
      const onClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // Delegate to existing handler
        handleArrowCanvasClick(e as unknown as any);
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
    }, [stageRef, handleArrowMouseMove, handleGroupMouseMoveSelection, handleCanvasPanMove, handleCanvasPanStart, handleGroupMouseDown, isArrowMode, dragItem, handleNodeDragEnd, handleGroupMouseUp, handleCanvasPanEnd, handleArrowCanvasClick, handleCanvasRightClick]);

    // Update arrow mode when prop changes
    useEffect(() => {
      dispatch(setArrowMode(propIsArrowMode));
    }, [propIsArrowMode, dispatch]);

    // Update square arrow mode when prop changes
    useEffect(() => {
      dispatch(setSquareArrowMode(propIsSquareArrowMode));
    }, [propIsSquareArrowMode, dispatch]);

    // Update curved arrow mode when prop changes
    useEffect(() => {
      dispatch(setCurvedArrowMode(propIsCurvedArrowMode));
    }, [propIsCurvedArrowMode, dispatch]);

    // Calculate connection point on node edge for new position
    const getConnectionPointForNewPosition = useCallback(
      (
        nodeX: number,
        nodeY: number,
        nodeWidth: number,
        nodeHeight: number,
        fromX: number,
        fromY: number,
      ) => {
        const nodeCenterX = nodeX + nodeWidth / 2;
        const nodeCenterY = nodeY + nodeHeight / 2;

        // Calculate angle from node center to the connecting point
        const angle = Math.atan2(fromY - nodeCenterY, fromX - nodeCenterX);

        // Calculate the connection point on the node's edge
        const connectionPoint = {
          x: nodeCenterX + Math.cos(angle) * (nodeWidth / 2),
          y: nodeCenterY + Math.sin(angle) * (nodeHeight / 2),
        };

        return connectionPoint;
      },
      [],
    );

    // Update arrow positions when nodes move
    const updateArrowPositions = useCallback(
      (nodeId: string, newX: number, newY: number) => {

        // Helper to calculate updates
        // We need to use the CURRENT nodes/arrows state here
        // If local mode, we need current localNodes/localArrows
        // But this function is memoized... dependency on nodes/arrows handles it.

        const updates: { id: string, updates: any }[] = [];

        // Update arrows connected to the moved node
        arrows.forEach((arrow) => {
          if (arrow.startNodeId === nodeId) {
            const node = nodes.find((n) => n.id === nodeId);
            if (node) {
              const connectionPoint = getConnectionPointForNewPosition(
                newX,
                newY,
                node.width,
                node.height,
                arrow.endX,
                arrow.endY,
              );

              updates.push({
                id: arrow.id,
                updates: {
                  startX: connectionPoint.x,
                  startY: connectionPoint.y,
                }
              });
            }
          } else if (arrow.endNodeId === nodeId) {
            const node = nodes.find((n) => n.id === nodeId);
            if (node) {
              const connectionPoint = getConnectionPointForNewPosition(
                newX,
                newY,
                node.width,
                node.height,
                arrow.startX,
                arrow.startY,
              );

              updates.push({
                id: arrow.id,
                updates: {
                  endX: connectionPoint.x,
                  endY: connectionPoint.y,
                }
              });
            }
          }
        });

        if (isLocalMode) {
          setLocalArrows(prev => prev.map(a => {
            const update = updates.find(u => u.id === a.id);
            return update ? { ...a, ...update.updates } : a;
          }));
        } else {
          updates.forEach(u => dispatch(updateArrow(u)));
        }
      },
      [nodes, arrows, dispatch, isLocalMode, getConnectionPointForNewPosition],
    );

    // Update arrow positions during group movement
    useEffect(() => {
      if (!isGroupMoving || !groupMoveOffset) return;

      // Update arrow positions for all selected nodes during group movement
      selectedItems.nodes.forEach((nodeId) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          updateArrowPositions(nodeId, node.x + groupMoveOffset.x, node.y + groupMoveOffset.y);
        }
      });
    }, [isGroupMoving, groupMoveOffset, selectedItems.nodes, nodes]);



    // Handle drag over events
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };

    // Convert toolbar icon path to canvas icon path
    const getCanvasIconPath = (resourceName: string, dragIconPath?: string): string => {
      // If a direct icon path is provided (from drag data), use it
      // This fixes the issue where dragging from toolbar wasn't using the correct icon
      if (dragIconPath && dragIconPath.startsWith('/')) {
        return dragIconPath;
      }

      // Map Kubernetes resource names to their icon paths
      const iconMap: Record<string, string> = {
        // Core
        'Pod': '/kubernetes/resources/unlabeled/pod.svg',
        'Service': '/kubernetes/resources/unlabeled/svc.svg',
        'Namespace': '/kubernetes/resources/unlabeled/ns.svg',
        'Node': '/kubernetes/resources/unlabeled/node.svg',
        'ConfigMap': '/kubernetes/resources/unlabeled/cm.svg',
        'Secret': '/kubernetes/resources/unlabeled/secret.svg',
        'ServiceAccount': '/kubernetes/resources/unlabeled/sa.svg',
        'PersistentVolume': '/kubernetes/resources/unlabeled/pv.svg',
        'PersistentVolumeClaim': '/kubernetes/resources/unlabeled/pvc.svg',
        'Event': '/kubernetes/resources/unlabeled/event.svg',
        'LimitRange': '/kubernetes/resources/unlabeled/limits.svg',
        'ResourceQuota': '/kubernetes/resources/unlabeled/quota.svg',
        'ReplicationController': '/kubernetes/resources/unlabeled/rc.svg',
        'Endpoints': '/kubernetes/resources/unlabeled/ep.svg',
        'Binding': '/kubernetes/resources/unlabeled/binding.svg',

        // Apps
        'Deployment': '/kubernetes/resources/unlabeled/deploy.svg',
        'StatefulSet': '/kubernetes/resources/unlabeled/sts.svg',
        'DaemonSet': '/kubernetes/resources/unlabeled/ds.svg',
        'ReplicaSet': '/kubernetes/resources/unlabeled/rs.svg',
        'ControllerRevision': '/kubernetes/resources/unlabeled/c-role.svg', // generic placeholder if missing

        // Batch
        'Job': '/kubernetes/resources/unlabeled/job.svg',
        'CronJob': '/kubernetes/resources/unlabeled/cronjob.svg',

        // Networking
        'Ingress': '/kubernetes/resources/unlabeled/ing.svg',
        'NetworkPolicy': '/kubernetes/resources/unlabeled/netpol.svg',

        // RBAC
        'Role': '/kubernetes/resources/unlabeled/role.svg',
        'RoleBinding': '/kubernetes/resources/unlabeled/rb.svg',
        'ClusterRole': '/kubernetes/resources/unlabeled/c-role.svg',
        'ClusterRoleBinding': '/kubernetes/resources/unlabeled/crb.svg',

        // Storage
        'StorageClass': '/kubernetes/resources/unlabeled/sc.svg',
        'Volume': '/kubernetes/resources/unlabeled/vol.svg',

        // Policy
        'PodSecurityPolicy': '/kubernetes/resources/unlabeled/psp.svg',

        // Custom
        'CustomResourceDefinition': '/kubernetes/resources/unlabeled/crd.svg',
        'Group': '/kubernetes/resources/unlabeled/group.svg',
        'User': '/kubernetes/resources/unlabeled/user.svg',
        'HorizontalPodAutoscaler': '/kubernetes/resources/unlabeled/hpa.svg',

        // Legacy/Toolbar mappings (fallbacks)
        'Logger': '/src/assets/icons/logger-canvas.svg',
        'Monitor': '/src/assets/icons/monitor-canvas.svg',
        'Config': '/src/assets/icons/config-canvas.svg',
        'LoadBalancer': '/src/assets/icons/lb-canvas.svg',
      };

      return iconMap[resourceName] || iconMap[resourceName.replace(/ /g, '')] || resourceName;
    };

    // Handle drop events
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('node-type');
      const nodeLabel = e.dataTransfer.getData('node-label');
      const nodeIcon = e.dataTransfer.getData('node-icon');

      if (nodeType && nodeLabel) {
        // Convert screen coordinates to canvas coordinates
        const stage = stageRef.current;
        if (!stage) return;

        const rect = stage.container().getBoundingClientRect();
        const scale = stage.scaleX();
        const stagePos = stage.position();

        // Convert screen coordinates to canvas coordinates
        const canvasX = (e.clientX - rect.left - stagePos.x) / scale;
        const canvasY = (e.clientY - rect.top - stagePos.y) / scale;

        const newNode: CanvasNode = {
          id: `${nodeType}-${Date.now()}`,
          type: nodeType,
          label: nodeLabel,
          iconSrc: getCanvasIconPath(nodeType, nodeIcon), // Pass nodeIcon for prioritization
          x: canvasX - 40, // Center the node
          y: canvasY - 30, // Center the node
          width: 100,
          height: 100,
          // Required GraphNode properties
          companyId: '', // TODO: Set from auth context
          name: nodeLabel,
          nodeType: nodeType as any, // TODO: Map to proper GraphNodeType enum
          userId: '', // TODO: Set from auth context
        };

        // Add the node to the canvas
        dispatch(addNode(newNode));

        // Start renaming immediately
        dispatch(setRenamingNodeId(newNode.id));
      }
    };



    // Handle node drag start
    const handleNodeDragStart = (nodeId: string) => {
      // Don't start individual drag if we're in group movement mode
      if (isGroupMoving) return;

      // If this node is part of a selected group, start group movement instead
      if (selectedItems.nodes.includes(nodeId) && selectedItems.nodes.length > 1) {
        // Start group movement - we'll get the actual position from the drag move event
        dispatch(setGroupMoving(true));
        dispatch(setGroupMoveStart({ x: 0, y: 0 })); // Will be updated in drag move
        dispatch(setGroupMoveOffset({ x: 0, y: 0 }));
        return;
      }

      dispatch(setDragItem(nodes.find((n) => n.id === nodeId) || null));
    };

    // Handle node drag move
    const handleNodeDragMove = (nodeId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const newX = e.target.x();
      const newY = e.target.y();

      // Smooth auto-scroll vertically when dragging near top/bottom edges
      // Prefer clientY from native event if available
      const clientY = (e.evt as MouseEvent | undefined)?.clientY;
      updateAutoScrollFromClient(clientY);

      // If we're in group movement mode and this is the dragged node, update group movement
      if (isGroupMoving && selectedItems.nodes.includes(nodeId)) {
        // Initialize group move start position if not set
        if (groupMoveStart && groupMoveStart.x === 0 && groupMoveStart.y === 0) {
          const node = nodes.find((n) => n.id === nodeId);
          if (node) {
            dispatch(setGroupMoveStart({ x: node.x, y: node.y }));
          }
        }

        if (groupMoveStart && groupMoveStart.x !== 0 && groupMoveStart.y !== 0) {
          const offsetX = newX - groupMoveStart.x;
          const offsetY = newY - groupMoveStart.y;
          dispatch(setGroupMoveOffset({ x: offsetX, y: offsetY }));
        }
        return;
      }

      // Handle individual drag move for non-group movement
      if (!isGroupMoving) {
        // Update arrow positions in real-time during drag
        updateArrowPositions(nodeId, newX, newY);
      }
    };


    // Handle node resize
    const handleNodeResize = useCallback(
      (nodeId: string, width: number, height: number) => {
        dispatch(updateNode({ id: nodeId, updates: { width, height } }));
      },
      [dispatch],
    );

    // Handle arrow start point move
    const handleArrowStartPointMove = useCallback(
      (arrowId: string, x: number, y: number) => {
        dispatch(updateArrow({ id: arrowId, updates: { startX: x, startY: y } }));
      },
      [dispatch],
    );

    // Handle arrow end point move
    const handleArrowEndPointMove = useCallback(
      (arrowId: string, x: number, y: number) => {
        dispatch(updateArrow({ id: arrowId, updates: { endX: x, endY: y } }));
      },
      [dispatch],
    );

    // Handle arrow start point attachment
    const handleArrowStartPointAttach = useCallback(
      (arrowId: string, nodeId: string) => {
        console.log('🔗 Attaching arrow start point:', { arrowId, nodeId });
        dispatch(updateArrow({ id: arrowId, updates: { startNodeId: nodeId } }));
      },
      [dispatch],
    );

    // Handle arrow end point attachment
    const handleArrowEndPointAttach = useCallback(
      (arrowId: string, nodeId: string) => {
        console.log('🔗 Attaching arrow end point:', { arrowId, nodeId });
        dispatch(updateArrow({ id: arrowId, updates: { endNodeId: nodeId } }));
      },
      [dispatch],
    );

    // Handle node selection
    const handleNodeSelect = useCallback(
      (nodeId: string, isSelected: boolean) => {
        dispatch(
          setSelectedItems({
            ...selectedItems,
            nodes: isSelected
              ? [...selectedItems.nodes, nodeId]
              : selectedItems.nodes.filter((id) => id !== nodeId),
          }),
        );

        // Call the external callback if provided
        if (onNodeSelect) {
          onNodeSelect(isSelected ? nodeId : null);
        }
      },
      [selectedItems, dispatch, onNodeSelect],
    );

    // Handle arrow selection
    const handleArrowSelect = useCallback(
      (arrowId: string, isSelected: boolean) => {
        dispatch(
          setSelectedItems({
            ...selectedItems,
            arrows: isSelected
              ? [...selectedItems.arrows, arrowId]
              : selectedItems.arrows.filter((id) => id !== arrowId),
          }),
        );
      },
      [selectedItems, dispatch],
    );

    // Delete handlers for context menu and delete buttons
    const handleDeleteNode = useCallback(
      (nodeId: string) => {
        dispatch(removeNode(nodeId));
        // Remove arrows connected to the deleted node
        arrows
          .filter((arrow) => arrow.startNodeId === nodeId || arrow.endNodeId === nodeId)
          .forEach((arrow) => dispatch(removeArrow(arrow.id)));
        dispatch(
          setSelectedItems({
            ...selectedItems,
            nodes: selectedItems.nodes.filter((id) => id !== nodeId),
          }),
        );
      },
      [dispatch, arrows, selectedItems],
    );

    const handleDeleteArrow = useCallback(
      (arrowId: string) => {
        dispatch(removeArrow(arrowId));
        dispatch(
          setSelectedItems({
            ...selectedItems,
            arrows: selectedItems.arrows.filter((id) => id !== arrowId),
          }),
        );
      },
      [dispatch, selectedItems],
    );

    const handleContextMenuDelete = useCallback(() => {
      if (contextMenu.type === 'node') {
        handleDeleteNode(contextMenu.id!);
      } else if (contextMenu.type === 'arrow') {
        handleDeleteArrow(contextMenu.id!);
      }
      dispatch(setContextMenu({ x: 0, y: 0, type: null, id: null }));
    }, [contextMenu, handleDeleteNode, handleDeleteArrow, dispatch]);

    // Zoom Handler
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

      // Calculate new scale
      let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

      // Clamp scale
      newScale = Math.max(0.1, Math.min(newScale, 5));

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      setStageScale(newScale);
      setStagePos(newPos);
      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
    }, []);

    // Drag Bound Function to restrict view
    const dragBoundFunc = useCallback((pos: { x: number; y: number }) => {
      const stage = stageRef.current;
      if (!stage) return pos;

      const scale = stage.scaleX();
      const stageWidth = stage.width();
      const stageHeight = stage.height();

      // Calculate strict drag bounds
      // We want to stop panning so that the user cannot drag the canvas content completely out of view
      // But we allow moving within the virtual dimensions

      const xMin = stageWidth - CANVAS_SIZE * scale - PADDING * scale;
      const xMax = PADDING * scale;
      const yMin = stageHeight - CANVAS_SIZE * scale - PADDING * scale;
      const yMax = PADDING * scale;

      return {
        x: Math.min(Math.max(pos.x, xMin), xMax),
        y: Math.min(Math.max(pos.y, yMin), yMax),
      };
    }, []);

    return (
      <div
        className="w-full h-full relative z-10"
        style={{ height: '100%', minHeight: '100%' }}
      >
        {showScrollTop && (
          <button
            onClick={handleScrollToTop}
            className="fixed bottom-6 right-6 z-20 rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Back to top"
            title="Back to top"
          >
            {/* Up Arrow Icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5l-7 7h4v7h6v-7h4l-7-7z" fill="currentColor" />
            </svg>
          </button>
        )}

        {/* AI Assistant */}
        <CanvasAIAssistant
          isOpen={showAIPanel}
          onToggle={() => setShowAIPanel(!showAIPanel)}
          onGenerateCode={onGenerateCode}
          onGeneratePlan={async (userRequest?: string) => {
            if (currentGraph) {
              await generatePlan(currentGraph, userRequest, selectedLlmProvider || undefined, selectedLlmModel || undefined);
            }
          }}
          currentGraph={currentGraph}
          generatedCode={generatedCode}
          isGenerating={isGenerating}
          isPlanning={isPlanning}
          error={error}
        />

        {/* Back to Content Button */}
        <CanvasNavigation
          showBackToContent={showBackToContent}
          onBackToContent={handleBackToContent}
        />
        <div
          ref={scrollContainerRef}
          className="overflow-auto relative"
          style={{ width: dimensions.width, height: dimensions.height }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Spacer to create scrollable virtual canvas area */}
          <div style={{ width: canvasSize.width, height: canvasSize.height }} />
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
            onDragEnd={(e) => {
              // Update position state after drag ends
              if (e.target === stageRef.current) {
                setStagePos(e.target.position());
              }
            }}
          >
            <Layer>
              {/* Background Dots Pattern */}
              <CanvasBackground />

              {/* Canvas Nodes */}
              {nodes.map((node) => {
                const isNodeDragging = dragItem?.id === node.id;
                const isNodeSelected = selectedItems.nodes.includes(node.id);
                const isSnapTarget = arrowSnapTarget === node.id;

                return (
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
                    isDragging={isNodeDragging}
                    isArrowMode={isArrowMode}
                    isSelected={isNodeSelected}
                    isSnapTarget={isSnapTarget}
                    color={node.color}

                    onDragStart={() => handleNodeDragStart(node.id)}
                    onDragMove={(e) => handleNodeDragMove(node.id, e)}
                    onDragEnd={(e) => handleNodeDragEnd(node.id, e)}
                    onResize={(width, height) => handleNodeResize(node.id, width, height)}
                    onClick={(nodeId, x, y) => handleArrowNodeClick(nodeId, x, y)}
                    onSelect={(isSelected) => handleNodeSelect(node.id, isSelected)}
                    onDblClick={(nodeId) => dispatch(setRenamingNodeId(nodeId))}
                    onRightClick={(nodeId, x, y) => {
                      setContextMenu({ x, y, type: 'node', id: nodeId });
                    }}


                  />
                );
              })}

              {/* Canvas Arrows */}
              {arrows.map((arrow) => {
                const isArrowSelected = selectedItems.arrows.includes(arrow.id);

                return (
                  <Arrow
                    key={arrow.id}
                    id={arrow.id}
                    startX={arrow.startX}
                    startY={arrow.startY}
                    endX={arrow.endX}
                    endY={arrow.endY}
                    isSelected={isArrowSelected}
                    isSquareArrow={isSquareArrowMode}
                    isCurvedArrow={isCurvedArrowMode}
                    startNodeId={arrow.startNodeId}
                    endNodeId={arrow.endNodeId}
                    nodes={nodes}
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
                      findElementsByCoordinates(x, y, nodes, arrows, threshold)
                    }
                  />
                );
              })}

              {/* Delete Buttons for Selected Elements */}
              <CanvasDeleteButtons
                selectedNodes={selectedItems.nodes}
                selectedArrows={selectedItems.arrows}
                nodes={nodes}
                arrows={arrows}
                onDeleteNode={handleDeleteNode}
                onDeleteArrow={handleDeleteArrow}
              />

              {/* Temporary Arrow Preview */}
              <CanvasArrowDrawing
                isDrawingArrow={isDrawingArrow}
                arrowStart={arrowStart}
                tempArrowEnd={tempArrowEnd}
                isSquareArrowMode={isSquareArrowMode}
                isCurvedArrowMode={isCurvedArrowMode}
                nodes={nodes}
                isSnapped={!!arrowSnapTarget}
                arrowSnapTarget={arrowSnapTarget}
              />

              {/* Selection Rectangle */}
              <CanvasSelection isSelecting={isSelecting} selectionRect={selectionRect} />

              {/* Group Movement Preview */}
              <CanvasGroupMovement
                isGroupMoving={isGroupMoving}
                groupMoveOffset={groupMoveOffset}
                selectedNodes={selectedItems.nodes}
                nodes={nodes}
              />

              {/* Context Menu */}
              <CanvasContextMenu contextMenu={contextMenu} onDelete={handleContextMenuDelete} />
            </Layer>
          </Stage>
        </div>
        {/* Renaming Overlay */}
        {renamingNodeId && (
          (() => {
            const node = nodes.find((n) => n.id === renamingNodeId);
            if (!node || !stageRef.current) return null;

            const stage = stageRef.current;
            const absolutePosition = {
              x: stage.x() + node.x * stage.scaleX(),
              y: stage.y() + node.y * stage.scaleX(),
            };

            const nodeWidth = node.width * stage.scaleX();
            const nodeHeight = node.height * stage.scaleX();

            return (
              <input
                autoFocus
                defaultValue={node.label}
                className="absolute z-50 text-center bg-transparent text-white focus:outline-none focus:ring-0"
                style={{
                  top: absolutePosition.y + nodeHeight - 25, // Position where label is
                  left: absolutePosition.x,
                  width: nodeWidth,
                  fontSize: '12px',
                  fontFamily: 'Inter, sans-serif',
                  padding: '2px',
                  transform: 'translateY(-50%)'
                }}
                onBlur={(e) => {
                  const newName = e.target.value;
                  if (newName && newName !== node.label) {
                    dispatch(updateNode({ id: node.id, updates: { label: newName, name: newName } }));
                    // Also update in project slice for persistence
                    dispatch(updateNodeInGraph({ nodeId: node.id, canvasNode: { ...node, label: newName, name: newName } }));
                  }
                  dispatch(setRenamingNodeId(null));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            );
          })()
        )}
      </div>
    );
  },
);

KonvaCanvas.displayName = 'KonvaCanvas';

export default KonvaCanvas;
