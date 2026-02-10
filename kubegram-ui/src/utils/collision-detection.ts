/**
 * Collision Detection Utilities for Arrow Routing
 *
 * Provides functions to detect and avoid collisions between arrows and nodes
 * when drawing arrow paths on the canvas.
 */

import { type CanvasNode } from '../types/canvas';

// ============================================================================
// Configuration Constants
// ============================================================================

/** Padding around nodes for collision detection (pixels) */
export const NODE_PADDING = 20;

/** Grid size for A* pathfinding (pixels) */
export const GRID_SIZE = 20;

/** Maximum path attempts before using fallback */
export const MAX_PATH_ATTEMPTS = 8;

/** Enable debug logging */
export const DEBUG_COLLISION = false;

// ============================================================================
// Core Collision Detection Functions
// ============================================================================

/**
 * Check if a line segment intersects with any nodes (with padding)
 *
 * @param x1 - Start X coordinate
 * @param y1 - Start Y coordinate
 * @param x2 - End X coordinate
 * @param y2 - End Y coordinate
 * @param nodes - Array of canvas nodes to check against
 * @param excludeNodeIds - Node IDs to exclude from collision detection
 * @param padding - Additional padding around nodes (default: NODE_PADDING)
 * @returns True if the line intersects with any nodes
 */
export function lineIntersectsNodes(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    nodes: CanvasNode[],
    excludeNodeIds: string[] = [],
    padding: number = NODE_PADDING
): boolean {
    // Filter out excluded nodes
    const checkNodes = nodes.filter(node => !excludeNodeIds.includes(node.id));

    // Check each node for intersection (with padding)
    for (const node of checkNodes) {
        if (lineIntersectsRect(
            x1, y1, x2, y2,
            node.x - padding,
            node.y - padding,
            node.width + padding * 2,
            node.height + padding * 2
        )) {
            return true;
        }
    }

    return false;
}

/**
 * Get expanded bounding box for a node with padding
 */
export function getNodeBoundingBox(node: CanvasNode, padding: number = NODE_PADDING) {
    return {
        x: node.x - padding,
        y: node.y - padding,
        width: node.width + padding * 2,
        height: node.height + padding * 2,
        right: node.x + node.width + padding,
        bottom: node.y + node.height + padding,
    };
}

// ============================================================================
// Path Calculation Functions
// ============================================================================

/**
 * Calculate a collision-aware square path between two points
 *
 * Uses multiple routing strategies:
 * 1. Direct line (if no collision)
 * 2. Horizontal-first path
 * 3. Vertical-first path
 * 4. 8-directional offset paths
 * 5. A* grid-based pathfinding (fallback)
 *
 * @param startX - Start X coordinate
 * @param startY - Start Y coordinate
 * @param endX - End X coordinate
 * @param endY - End Y coordinate
 * @param nodes - Array of canvas nodes to avoid
 * @param excludeNodeIds - Node IDs to exclude from collision detection
 * @param padding - Padding around nodes (default: NODE_PADDING)
 * @returns Array of points defining the path
 */
export function calculateCollisionAwareSquarePath(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    nodes: CanvasNode[],
    excludeNodeIds: string[] = [],
    padding: number = NODE_PADDING
): number[] {
    // Filter nodes once
    const checkNodes = nodes.filter(node => !excludeNodeIds.includes(node.id));

    if (DEBUG_COLLISION) {
        console.log('🔍 Calculating collision-aware path:', {
            start: { x: startX, y: startY },
            end: { x: endX, y: endY },
            nodeCount: checkNodes.length,
            padding
        });
    }

    // Strategy 1: Try direct line first
    if (!lineIntersectsNodes(startX, startY, endX, endY, checkNodes, [], padding)) {
        if (DEBUG_COLLISION) console.log('✅ Direct path clear');
        return [startX, startY, endX, endY];
    }

    // Strategy 2: Try horizontal-first path
    const horizontalFirstPath = [startX, startY, endX, startY, endX, endY];
    if (!pathIntersectsNodes(horizontalFirstPath, checkNodes, [], padding)) {
        if (DEBUG_COLLISION) console.log('✅ Horizontal-first path clear');
        return horizontalFirstPath;
    }

    // Strategy 3: Try vertical-first path
    const verticalFirstPath = [startX, startY, startX, endY, endX, endY];
    if (!pathIntersectsNodes(verticalFirstPath, checkNodes, [], padding)) {
        if (DEBUG_COLLISION) console.log('✅ Vertical-first path clear');
        return verticalFirstPath;
    }

    // Strategy 4: Try offset paths (go around obstacles)
    const offsetPaths = generateOffsetPaths(startX, startY, endX, endY, checkNodes, padding);
    for (const path of offsetPaths) {
        if (!pathIntersectsNodes(path, checkNodes, [], padding)) {
            if (DEBUG_COLLISION) console.log('✅ Offset path found');
            return path;
        }
    }

    // Strategy 5: A* grid-based pathfinding
    const aStarPath = calculateAStarPath(startX, startY, endX, endY, checkNodes, padding);
    if (aStarPath.length > 0) {
        if (DEBUG_COLLISION) console.log('✅ A* path found');
        return aStarPath;
    }

    // Fallback: Use midpoint path (may still collide, but provides a reasonable route)
    if (DEBUG_COLLISION) console.log('⚠️ Using fallback midpoint path');
    const midX = (startX + endX) / 2;
    return [startX, startY, midX, startY, midX, endY, endX, endY];
}

/**
 * Generate offset paths that go around obstacles
 */
function generateOffsetPaths(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    nodes: CanvasNode[],
    padding: number
): number[][] {
    const paths: number[][] = [];
    const offsets = [50, 100, 150, -50, -100, -150];

    // Calculate bounds of all nodes to find good offset positions
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of nodes) {
        const box = getNodeBoundingBox(node, padding);
        minX = Math.min(minX, box.x);
        minY = Math.min(minY, box.y);
        maxX = Math.max(maxX, box.right);
        maxY = Math.max(maxY, box.bottom);
    }

    // Add paths that go around the obstacles
    for (const offset of offsets) {
        // Horizontal offset path (go above or below)
        const hPath = [
            startX, startY,
            startX, startY + offset,
            endX, startY + offset,
            endX, endY
        ];
        paths.push(hPath);

        // Vertical offset path (go left or right)
        const vPath = [
            startX, startY,
            startX + offset, startY,
            startX + offset, endY,
            endX, endY
        ];
        paths.push(vPath);

        // L-shaped path going around
        const lPath = [
            startX, startY,
            minX - padding - 20, startY,
            minX - padding - 20, endY,
            endX, endY
        ];
        paths.push(lPath);

        // R-shaped path going around
        const rPath = [
            startX, startY,
            maxX + padding + 20, startY,
            maxX + padding + 20, endY,
            endX, endY
        ];
        paths.push(rPath);
    }

    return paths;
}

// ============================================================================
// A* Pathfinding Implementation
// ============================================================================

interface GridNode {
    x: number;
    y: number;
    g: number; // Cost from start
    h: number; // Heuristic (estimated cost to end)
    f: number; // Total cost (g + h)
    parent: GridNode | null;
}

/**
 * Calculate path using A* algorithm
 */
function calculateAStarPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    nodes: CanvasNode[],
    padding: number
): number[] {
    // Determine grid bounds
    const allX = [startX, endX, ...nodes.flatMap(n => [n.x - padding, n.x + n.width + padding])];
    const allY = [startY, endY, ...nodes.flatMap(n => [n.y - padding, n.y + n.height + padding])];

    const minX = Math.min(...allX) - GRID_SIZE * 5;
    const maxX = Math.max(...allX) + GRID_SIZE * 5;
    const minY = Math.min(...allY) - GRID_SIZE * 5;
    const maxY = Math.max(...allY) + GRID_SIZE * 5;

    // Snap start and end to grid
    const gridStartX = Math.round(startX / GRID_SIZE) * GRID_SIZE;
    const gridStartY = Math.round(startY / GRID_SIZE) * GRID_SIZE;
    const gridEndX = Math.round(endX / GRID_SIZE) * GRID_SIZE;
    const gridEndY = Math.round(endY / GRID_SIZE) * GRID_SIZE;

    // Check if a grid cell is blocked
    const isBlocked = (x: number, y: number): boolean => {
        for (const node of nodes) {
            const box = getNodeBoundingBox(node, padding);
            if (x >= box.x && x <= box.right && y >= box.y && y <= box.bottom) {
                return true;
            }
        }
        return false;
    };

    // A* implementation
    const openSet: GridNode[] = [];
    const closedSet = new Set<string>();
    const nodeKey = (x: number, y: number) => `${x},${y}`;

    const heuristic = (x: number, y: number) =>
        Math.abs(x - gridEndX) + Math.abs(y - gridEndY);

    const startNode: GridNode = {
        x: gridStartX,
        y: gridStartY,
        g: 0,
        h: heuristic(gridStartX, gridStartY),
        f: heuristic(gridStartX, gridStartY),
        parent: null
    };

    openSet.push(startNode);

    // Direction vectors (8 directions)
    const directions = [
        [0, -GRID_SIZE], [GRID_SIZE, 0], [0, GRID_SIZE], [-GRID_SIZE, 0], // Cardinal
        [GRID_SIZE, -GRID_SIZE], [GRID_SIZE, GRID_SIZE], [-GRID_SIZE, GRID_SIZE], [-GRID_SIZE, -GRID_SIZE] // Diagonal
    ];

    let iterations = 0;
    const maxIterations = 1000; // Prevent infinite loops

    while (openSet.length > 0 && iterations < maxIterations) {
        iterations++;

        // Find node with lowest f score
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift()!;

        // Check if we reached the goal
        if (current.x === gridEndX && current.y === gridEndY) {
            // Reconstruct path
            const path: number[] = [startX, startY];
            let node: GridNode | null = current;
            const gridPath: { x: number, y: number }[] = [];

            while (node) {
                gridPath.unshift({ x: node.x, y: node.y });
                node = node.parent;
            }

            // Simplify path (remove collinear points)
            for (let i = 1; i < gridPath.length - 1; i++) {
                const prev = gridPath[i - 1];
                const curr = gridPath[i];
                const next = gridPath[i + 1];

                // Check if points are collinear
                const dx1 = curr.x - prev.x;
                const dy1 = curr.y - prev.y;
                const dx2 = next.x - curr.x;
                const dy2 = next.y - curr.y;

                if (dx1 !== dx2 || dy1 !== dy2) {
                    path.push(curr.x, curr.y);
                }
            }

            path.push(endX, endY);
            return path;
        }

        closedSet.add(nodeKey(current.x, current.y));

        // Explore neighbors
        for (const [dx, dy] of directions) {
            const nx = current.x + dx;
            const ny = current.y + dy;

            // Skip if out of bounds
            if (nx < minX || nx > maxX || ny < minY || ny > maxY) continue;

            // Skip if already visited
            if (closedSet.has(nodeKey(nx, ny))) continue;

            // Skip if blocked
            if (isBlocked(nx, ny)) continue;

            // Check if path to neighbor is blocked
            if (lineIntersectsNodes(current.x, current.y, nx, ny, nodes, [], padding)) continue;

            const g = current.g + Math.sqrt(dx * dx + dy * dy);
            const h = heuristic(nx, ny);
            const f = g + h;

            // Check if already in open set with better score
            const existing = openSet.find(n => n.x === nx && n.y === ny);
            if (existing && existing.f <= f) continue;

            if (existing) {
                existing.g = g;
                existing.h = h;
                existing.f = f;
                existing.parent = current;
            } else {
                openSet.push({
                    x: nx,
                    y: ny,
                    g,
                    h,
                    f,
                    parent: current
                });
            }
        }
    }

    // No path found
    if (DEBUG_COLLISION) console.log('❌ A* failed to find path');
    return [];
}

// ============================================================================
// Debug Visualization Data
// ============================================================================

export interface CollisionDebugData {
    nodeBoundingBoxes: Array<{
        nodeId: string;
        x: number;
        y: number;
        width: number;
        height: number;
        paddedX: number;
        paddedY: number;
        paddedWidth: number;
        paddedHeight: number;
    }>;
    pathAttempts: Array<{
        points: number[];
        success: boolean;
        strategy: string;
    }>;
}

/**
 * Generate debug visualization data for collision detection
 */
export function generateCollisionDebugData(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    nodes: CanvasNode[],
    excludeNodeIds: string[] = [],
    padding: number = NODE_PADDING
): CollisionDebugData {
    const checkNodes = nodes.filter(node => !excludeNodeIds.includes(node.id));

    // Generate bounding box data
    const nodeBoundingBoxes = checkNodes.map(node => ({
        nodeId: node.id,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        paddedX: node.x - padding,
        paddedY: node.y - padding,
        paddedWidth: node.width + padding * 2,
        paddedHeight: node.height + padding * 2,
    }));

    // Generate path attempt data
    const pathAttempts: CollisionDebugData['pathAttempts'] = [];

    // Direct
    const directPath = [startX, startY, endX, endY];
    pathAttempts.push({
        points: directPath,
        success: !lineIntersectsNodes(startX, startY, endX, endY, checkNodes, [], padding),
        strategy: 'direct'
    });

    // Horizontal-first
    const hPath = [startX, startY, endX, startY, endX, endY];
    pathAttempts.push({
        points: hPath,
        success: !pathIntersectsNodes(hPath, checkNodes, [], padding),
        strategy: 'horizontal-first'
    });

    // Vertical-first
    const vPath = [startX, startY, startX, endY, endX, endY];
    pathAttempts.push({
        points: vPath,
        success: !pathIntersectsNodes(vPath, checkNodes, [], padding),
        strategy: 'vertical-first'
    });

    return { nodeBoundingBoxes, pathAttempts };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a line segment intersects with a rectangle
 */
function lineIntersectsRect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number
): boolean {
    // Check if either endpoint is inside the rectangle
    if (pointInRect(x1, y1, rectX, rectY, rectWidth, rectHeight) ||
        pointInRect(x2, y2, rectX, rectY, rectWidth, rectHeight)) {
        return true;
    }

    // Check if line intersects any of the four rectangle edges
    const rectRight = rectX + rectWidth;
    const rectBottom = rectY + rectHeight;

    return (
        lineIntersectsLine(x1, y1, x2, y2, rectX, rectY, rectRight, rectY) || // Top edge
        lineIntersectsLine(x1, y1, x2, y2, rectRight, rectY, rectRight, rectBottom) || // Right edge
        lineIntersectsLine(x1, y1, x2, y2, rectX, rectBottom, rectRight, rectBottom) || // Bottom edge
        lineIntersectsLine(x1, y1, x2, y2, rectX, rectY, rectX, rectBottom) // Left edge
    );
}

/**
 * Check if a point is inside a rectangle
 */
function pointInRect(
    px: number,
    py: number,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number
): boolean {
    return px >= rectX && px <= rectX + rectWidth &&
        py >= rectY && py <= rectY + rectHeight;
}

/**
 * Check if two line segments intersect
 */
function lineIntersectsLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
): boolean {
    const denominator = ((x2 - x1) * (y4 - y3)) - ((y2 - y1) * (x4 - x3));

    if (denominator === 0) {
        return false; // Lines are parallel
    }

    const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
    const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;

    return (ua >= 0 && ua <= 1) && (ub >= 0 && ub <= 1);
}

/**
 * Check if a path (series of line segments) intersects with any nodes
 */
function pathIntersectsNodes(
    points: number[],
    nodes: CanvasNode[],
    excludeNodeIds: string[] = [],
    padding: number = NODE_PADDING
): boolean {
    // Check each segment of the path
    for (let i = 0; i < points.length - 2; i += 2) {
        if (lineIntersectsNodes(
            points[i], points[i + 1],
            points[i + 2], points[i + 3],
            nodes,
            excludeNodeIds,
            padding
        )) {
            return true;
        }
    }
    return false;
}
