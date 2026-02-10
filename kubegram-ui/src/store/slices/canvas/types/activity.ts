import type { CanvasNode } from '@/types/canvas';

/**
 * Canvas activity and interaction types
 */

/**
 * Point coordinate
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * Rectangle
 */
export interface Rectangle extends Point {
    width: number;
    height: number;
}

/**
 * Context menu state
 */
export interface ContextMenu {
    x: number;
    y: number;
    type: 'node' | 'arrow' | null;
    id: string | null;
}

/**
 * Selection state
 */
export interface Selection {
    nodes: string[];
    arrows: string[];
}

/**
 * Arrow drawing state
 */
export interface ArrowDrawingState {
    isArrowMode: boolean;
    isSquareArrowMode: boolean;
    isCurvedArrowMode: boolean;
    arrowStart: { nodeId: string; x: number; y: number } | null;
    isDrawingArrow: boolean;
    tempArrowEnd: Point | null;
    arrowSnapTarget: string | null; // Node ID that arrow will snap to
}

/**
 * Selection state
 */
export interface SelectionState {
    isSelecting: boolean;
    selectionRect: Rectangle | null;
}

/**
 * Group operation state
 */
export interface GroupOperationState {
    isGroupMoving: boolean;
    groupMoveStart: Point | null;
    groupMoveOffset: Point | null;
}

/**
 * Navigation state
 */
export interface NavigationState {
    isPanning: boolean;
    panStart: Point;
    showBackToContent: boolean;
}

/**
 * Combined canvas activity state
 */
export interface CanvasActivity extends ArrowDrawingState, SelectionState, GroupOperationState, NavigationState {
    selectedItems: Selection;
    contextMenu: ContextMenu;
    dragItem: CanvasNode | null;
    renamingNodeId: string | null;
}
