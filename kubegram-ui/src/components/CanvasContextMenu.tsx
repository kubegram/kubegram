import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { type ContextMenu } from '../store/slices/canvas/types';

interface CanvasContextMenuProps {
  contextMenu: ContextMenu;
  onDelete: () => void;
  selectedCount?: number;
  onCopy?: () => void;
  onDuplicate?: () => void;
  onAlignLeft?: () => void;
  onAlignCenter?: () => void;
  onAlignRight?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
}

/**
 * CanvasContextMenu Component
 *
 * Enhanced context menu with multi-select awareness and additional actions.
 * Provides delete, copy, paste, duplicate, alignment, and z-order functionality.
 */
const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  contextMenu,
  onDelete,
  selectedCount = 1,
  onCopy,
  onDuplicate,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onBringToFront,
  onSendToBack,
}) => {
  if (!contextMenu.type || !contextMenu.id) {
    return null;
  }

  const isMultiSelect = selectedCount > 1;
  const menuHeight = isMultiSelect ? 180 : 40;
  const menuWidth = 160;

  const menuItems = [
    // Basic actions
    { key: 'delete', label: isMultiSelect ? `Delete (${selectedCount})` : 'Delete', y: 5, color: '#FF4444', onClick: onDelete },
    ...(isMultiSelect ? [
      { key: 'duplicate', label: `Duplicate (${selectedCount})`, y: 40, color: '#3B82F6', onClick: onDuplicate },
      { key: 'copy', label: 'Copy', y: 75, color: '#10B981', onClick: onCopy },
    ] : []),
    // Multi-select specific actions
    ...(isMultiSelect ? [
      { key: 'align-left', label: 'Align Left', y: 110, color: '#6366F1', onClick: onAlignLeft },
      { key: 'align-center', label: 'Align Center', y: 135, color: '#6366F1', onClick: onAlignCenter },
      { key: 'align-right', label: 'Align Right', y: 160, color: '#6366F1', onClick: onAlignRight },
    ] : []),
  ];

  const zOrderItems = [
    { key: 'bring-front', label: 'Bring to Front', y: menuHeight - 35, color: '#8B5CF6', onClick: onBringToFront },
    { key: 'send-back', label: 'Send to Back', y: menuHeight - 10, color: '#8B5CF6', onClick: onSendToBack },
  ];

  return (
    <Group x={contextMenu.x} y={contextMenu.y}>
      {/* Background */}
      <Rect
        x={0}
        y={0}
        width={menuWidth}
        height={menuHeight}
        fill="#1F2937"
        stroke="#374151"
        strokeWidth={1}
        cornerRadius={6}
        shadowColor="black"
        shadowBlur={12}
        shadowOpacity={0.4}
        shadowOffsetX={2}
        shadowOffsetY={2}
      />

      {/* Menu items */}
      {menuItems.map((item) => (
        <Group key={item.key}>
          {/* Clickable background */}
          <Rect
            x={5}
            y={item.y}
            width={menuWidth - 10}
            height={25}
            fill="transparent"
            cornerRadius={3}
            onClick={item.onClick}
            onTap={item.onClick}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                const container = stage.container();
                container.style.cursor = 'pointer';
              }
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                const container = stage.container();
                container.style.cursor = 'default';
              }
            }}
          />
          {/* Item text */}
          <Text
            x={15}
            y={item.y + 17}
            text={item.label}
            fontSize={13}
            fill={item.color}
            fontFamily="Inter, sans-serif"
            fontStyle="bold"
          />
        </Group>
      ))}

      {/* Z-order items (separator line above) */}
      {isMultiSelect && (
        <>
          {/* Separator */}
          <Rect
            x={10}
            y={menuHeight - 40}
            width={menuWidth - 20}
            height={1}
            fill="#4B5563"
          />
          {zOrderItems.map((item) => (
            <Group key={item.key}>
              {/* Clickable background */}
              <Rect
                x={5}
                y={item.y}
                width={menuWidth - 10}
                height={20}
                fill="transparent"
                cornerRadius={3}
                onClick={item.onClick}
                onTap={item.onClick}
                onMouseEnter={(e) => {
                  const stage = e.target.getStage();
                  if (stage) {
                    const container = stage.container();
                    container.style.cursor = 'pointer';
                  }
                }}
                onMouseLeave={(e) => {
                  const stage = e.target.getStage();
                  if (stage) {
                    const container = stage.container();
                    container.style.cursor = 'default';
                  }
                }}
              />
              {/* Item text */}
              <Text
                x={15}
                y={item.y + 14}
                text={item.label}
                fontSize={11}
                fill={item.color}
                fontFamily="Inter, sans-serif"
              />
            </Group>
          ))}
        </>
      )}

      {/* Multi-select indicator */}
      {isMultiSelect && (
        <Text
          x={menuWidth / 2}
          y={menuHeight - 20}
          text={`${selectedCount} items selected`}
          fontSize={10}
          fill="#9CA3AF"
          fontFamily="Inter, sans-serif"
          align="center"
          offsetX={35}
        />
      )}
    </Group>
  );
};

export default CanvasContextMenu;
