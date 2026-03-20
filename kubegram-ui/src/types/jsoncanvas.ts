/**
 * JSON Canvas 1.0 Specification Types
 * @see https://jsoncanvas.org/spec/1.0/
 */

// Colors: hex string or preset number "1"-"6"
// Presets: 1=red, 2=orange, 3=yellow, 4=green, 5=cyan, 6=purple
export type JsonCanvasColor = `#${string}` | '1' | '2' | '3' | '4' | '5' | '6';

export type NodeSide = 'top' | 'right' | 'bottom' | 'left';

export type EndType = 'none' | 'arrow';

// --- Node types ---

export interface JsonCanvasNodeBase {
  id: string;
  type: 'text' | 'file' | 'link' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  color?: JsonCanvasColor;
}

export interface TextNode extends JsonCanvasNodeBase {
  type: 'text';
  text: string;
}

export interface FileNode extends JsonCanvasNodeBase {
  type: 'file';
  file: string;
  subpath?: string;
}

export interface LinkNode extends JsonCanvasNodeBase {
  type: 'link';
  url: string;
}

export interface GroupNode extends JsonCanvasNodeBase {
  type: 'group';
  label?: string;
  background?: string;
  backgroundStyle?: 'cover' | 'ratio' | 'repeat';
}

export type JsonCanvasNode = TextNode | FileNode | LinkNode | GroupNode;

// --- Edge type ---

export interface JsonCanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: NodeSide;
  toSide?: NodeSide;
  fromEnd?: EndType;
  toEnd?: EndType;
  color?: JsonCanvasColor;
  label?: string;
  pathMode?: 'straight' | 'square' | 'curved';
}

// --- Enhanced Visual Components Types ---

export interface Point {
  x: number;
  y: number;
}

export interface SelectionRect extends Point {
  width: number;
  height: number;
}

export type ResizeHandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface SelectionHandle {
  type: ResizeHandleType;
  position: Point;
  cursor: string;
}

export interface SelectionBadge {
  count: number;
  position: Point;
  visible: boolean;
  animated?: boolean;
}

export interface SelectionHandles {
  corners: SelectionHandle[];
  edges: SelectionHandle[];
}

// --- Top-level document ---

export interface JsonCanvas {
  nodes?: JsonCanvasNode[];
  edges?: JsonCanvasEdge[];
}
