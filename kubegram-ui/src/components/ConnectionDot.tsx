import React, { memo } from 'react';
import { Circle, Line } from 'react-konva';
import type { CanvasNode } from '@/types/canvas';
import type { NodeSide } from '@/types/jsoncanvas';
import { calculateAngleBasedConnectionPoint, getCardinalConnectionPoints } from '@/utils/collision-detection';

interface ConnectionDotProps {
  nodeId: string;
  node: CanvasNode;
  side: NodeSide;
  isArrowMode: boolean;
  mouseX: number;
  mouseY: number;
  isHovered: boolean;
  isHighlighted: boolean;
  onClick: (side: NodeSide, x: number, y: number) => void;
  onHover: (side: NodeSide | null) => void;
}

/**
 * ConnectionDot component for JSON Canvas standard edge clicking
 * 
 * Provides visual feedback for cardinal connection points while preserving
 * angle-based precision for collision handling and pathfinding.
 */
const ConnectionDot: React.FC<ConnectionDotProps> = memo(({
  node,
  side,
  isArrowMode,
  mouseX,
  mouseY,
  isHovered,
  isHighlighted,
  onClick,
  onHover,
}) => {
  // Get the cardinal point for this side
  const cardinalPoint = getCardinalConnectionPoints(node).find(p => p.side === side);
  if (!cardinalPoint) return null;

  // Calculate angle-based connection point for this mouse position
  const angleBasedPoint = calculateAngleBasedConnectionPoint(node, mouseX, mouseY);
  
  // Distance from mouse to cardinal point
  const distanceToCardinal = Math.sqrt(
    (mouseX - cardinalPoint.x)**2 + (mouseY - cardinalPoint.y)**2
  );
  
  // Is this connection point active (near mouse)?
  const isActive = distanceToCardinal < 15;
  const actualConnectionPoint = isActive ? angleBasedPoint : cardinalPoint;

  // Determine dot appearance
  const radius = isHovered ? 8 : isHighlighted ? 6 : 4;
  const fillColor = isHighlighted ? '#00ff00' : isHovered ? '#ffffff' : '#666666';
  const strokeColor = isHighlighted ? '#00ff00' : isHovered ? '#ffffff' : '#666666';
  const opacity = isArrowMode ? 1 : 0;

  return (
    <>
      {/* Cardinal point indicator dot */}
      <Circle
        x={cardinalPoint.x}
        y={cardinalPoint.y}
        radius={radius}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={2}
        opacity={opacity}
        listening={false} // Prevent interaction with the visual dot
      />
      
      {/* Show line from cardinal point to actual angle-based connection when active */}
      {isActive && (
        <Line
          points={[
            cardinalPoint.x, 
            cardinalPoint.y, 
            actualConnectionPoint.x, 
            actualConnectionPoint.y
          ]}
          stroke="#ffffff"
          strokeWidth={1}
          opacity={0.7}
          dash={[5, 5]}
          listening={false}
        />
      )}
      
      {/* Invisible click area at the actual connection point */}
      <Circle
        x={actualConnectionPoint.x}
        y={actualConnectionPoint.y}
        radius={12} // Larger hit area for easier interaction
        fill="transparent"
        opacity={isArrowMode ? 1 : 0}
        onClick={(e) => {
          e.cancelBubble = true;
          onClick(side, actualConnectionPoint.x, actualConnectionPoint.y);
        }}
        onMouseEnter={() => onHover(side)}
        onMouseLeave={() => onHover(null)}
      />
    </>
  );
});

ConnectionDot.displayName = 'ConnectionDot';

export default ConnectionDot;