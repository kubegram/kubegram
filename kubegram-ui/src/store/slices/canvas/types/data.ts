import type { CanvasNode, CanvasArrow } from '@/types/canvas';

/**
 * Canvas data storage types
 */

/**
 * Canvas elements lookup
 */
export interface CanvasElementsLookup {
    nodes: CanvasNode[];
    arrows: CanvasArrow[];
}

/**
 * Graphs metadata record
 */
export type GraphsMetadata = Record<string, Record<string, any>>;
