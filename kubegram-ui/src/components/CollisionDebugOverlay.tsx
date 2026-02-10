import React, { memo } from 'react';
import { Group, Rect, Line, Text } from 'react-konva';
import { type CanvasNode } from '../types/canvas';
import {
    NODE_PADDING,
    generateCollisionDebugData,
    type CollisionDebugData
} from '../utils/collision-detection';

interface CollisionDebugOverlayProps {
    /** Whether debug mode is enabled */
    enabled: boolean;
    /** All nodes on the canvas */
    nodes: CanvasNode[];
    /** Optional: specific arrow for path debugging */
    debugArrow?: {
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        startNodeId?: string;
        endNodeId?: string;
    };
    /** Custom padding (optional) */
    padding?: number;
}

/**
 * Collision Debug Overlay Component
 *
 * Renders visual debugging information for collision detection:
 * - Node bounding boxes (original and padded)
 * - Path calculation attempts
 * - Success/failure indicators
 */
const CollisionDebugOverlay: React.FC<CollisionDebugOverlayProps> = memo(({
    enabled,
    nodes,
    debugArrow,
    padding = NODE_PADDING
}) => {
    if (!enabled) return null;

    // Generate debug data if we have an arrow to debug
    let debugData: CollisionDebugData | null = null;
    if (debugArrow) {
        const excludeNodeIds: string[] = [];
        if (debugArrow.startNodeId) excludeNodeIds.push(debugArrow.startNodeId);
        if (debugArrow.endNodeId) excludeNodeIds.push(debugArrow.endNodeId);

        debugData = generateCollisionDebugData(
            debugArrow.startX,
            debugArrow.startY,
            debugArrow.endX,
            debugArrow.endY,
            nodes,
            excludeNodeIds,
            padding
        );
    }

    return (
        <Group>
            {/* Render padded bounding boxes for all nodes */}
            {nodes.map((node) => (
                <Group key={`debug-${node.id}`}>
                    {/* Original node bounds (blue dashed) */}
                    <Rect
                        x={node.x}
                        y={node.y}
                        width={node.width}
                        height={node.height}
                        stroke="#3B82F6"
                        strokeWidth={1}
                        dash={[4, 4]}
                        fill="transparent"
                    />

                    {/* Padded bounds (orange) */}
                    <Rect
                        x={node.x - padding}
                        y={node.y - padding}
                        width={node.width + padding * 2}
                        height={node.height + padding * 2}
                        stroke="#F97316"
                        strokeWidth={1}
                        fill="rgba(249, 115, 22, 0.1)"
                    />

                    {/* Node ID label */}
                    <Text
                        x={node.x - padding}
                        y={node.y - padding - 16}
                        text={node.id.slice(0, 8)}
                        fontSize={10}
                        fill="#F97316"
                    />
                </Group>
            ))}

            {/* Render path attempts if debugging an arrow */}
            {debugData?.pathAttempts.map((attempt, index) => (
                <Group key={`path-attempt-${index}`}>
                    <Line
                        points={attempt.points}
                        stroke={attempt.success ? '#22C55E' : '#EF4444'}
                        strokeWidth={attempt.success ? 2 : 1}
                        opacity={attempt.success ? 0.8 : 0.4}
                        dash={attempt.success ? undefined : [5, 5]}
                        lineCap="round"
                        lineJoin="round"
                    />

                    {/* Strategy label */}
                    <Text
                        x={attempt.points[0] + 5}
                        y={attempt.points[1] - 10 - index * 12}
                        text={`${attempt.strategy}: ${attempt.success ? '✓' : '✗'}`}
                        fontSize={10}
                        fill={attempt.success ? '#22C55E' : '#EF4444'}
                    />
                </Group>
            ))}

            {/* Debug legend */}
            <Group x={10} y={10}>
                <Rect
                    x={0}
                    y={0}
                    width={180}
                    height={80}
                    fill="rgba(0, 0, 0, 0.7)"
                    cornerRadius={4}
                />
                <Text
                    x={8}
                    y={8}
                    text="Collision Debug"
                    fontSize={12}
                    fontStyle="bold"
                    fill="#FFFFFF"
                />
                <Rect x={8} y={28} width={12} height={12} stroke="#3B82F6" strokeWidth={1} dash={[2, 2]} />
                <Text x={24} y={28} text="Node bounds" fontSize={10} fill="#FFFFFF" />
                <Rect x={8} y={44} width={12} height={12} stroke="#F97316" strokeWidth={1} fill="rgba(249, 115, 22, 0.3)" />
                <Text x={24} y={44} text={`Padded (${padding}px)`} fontSize={10} fill="#FFFFFF" />
                <Line points={[8, 66, 20, 66]} stroke="#22C55E" strokeWidth={2} />
                <Text x={24} y={60} text="Path OK" fontSize={10} fill="#22C55E" />
                <Line points={[80, 66, 92, 66]} stroke="#EF4444" strokeWidth={1} dash={[3, 3]} />
                <Text x={96} y={60} text="Collision" fontSize={10} fill="#EF4444" />
            </Group>
        </Group>
    );
});

CollisionDebugOverlay.displayName = 'CollisionDebugOverlay';

export default CollisionDebugOverlay;
