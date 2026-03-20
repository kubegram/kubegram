import React from 'react';
import { Group, Circle, Text } from 'react-konva';
import type { SelectionBadge } from '@/types/jsoncanvas';

interface SelectionBadgeProps {
  badge: SelectionBadge;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  animated?: boolean;
}

/**
 * SelectionBadge Component
 * 
 * Displays a count badge showing the number of selected items.
 * Features smooth animations and configurable styling.
 */
const SelectionBadgeComponent: React.FC<SelectionBadgeProps> = ({
  badge,
  size = 20,
  backgroundColor = '#1E40AF',
  textColor = '#FFFFFF',
  fontSize = 10,
  animated = true,
}) => {
  if (!badge.visible || badge.count <= 1) {
    return null;
  }

  const displayCount = badge.count > 99 ? '99+' : badge.count.toString();
  
  return (
    <Group
      x={badge.position.x}
      y={badge.position.y}
      scaleX={badge.animated && animated ? 0 : 1}
      scaleY={badge.animated && animated ? 0 : 1}
      opacity={badge.animated && animated ? 0 : 1}
    >
      {badge.animated && animated && (
        <>
          {/* Mount animation */}
          <Circle
            radius={size / 2}
            fill={backgroundColor}
            x={size / 2}
            y={size / 2}
          />
          <Text
            x={size / 2}
            y={size / 2}
            text={displayCount}
            fontSize={fontSize}
            fontFamily="Inter, sans-serif"
            fill={textColor}
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            offsetX={fontSize * displayCount.length * 0.3}
            offsetY={fontSize * 0.35}
          />
        </>
      )}
      
      {/* Static badge */}
      <Circle
        radius={size / 2}
        fill={backgroundColor}
        x={size / 2}
        y={size / 2}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.3}
        shadowOffsetX={1}
        shadowOffsetY={1}
      />
      <Text
        x={size / 2}
        y={size / 2}
        text={displayCount}
        fontSize={fontSize}
        fontFamily="Inter, sans-serif"
        fill={textColor}
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
        offsetX={fontSize * displayCount.length * 0.3}
        offsetY={fontSize * 0.35}
      />
    </Group>
  );
};

export default SelectionBadgeComponent;