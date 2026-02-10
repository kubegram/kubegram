import React, { memo } from 'react';
import { Group, Text, Label, Tag } from 'react-konva';

interface InfoTooltipProps {
    x: number;
    y: number;
    data: Record<string, string | number>;
    visible: boolean;
}

const InfoTooltip: React.FC<InfoTooltipProps> = memo(({ x, y, data, visible }) => {
    if (!visible) return null;

    // Format the data into lines
    const lines = Object.entries(data).map(([key, value]) => `${key}: ${value}`);
    const lineHeight = 16;
    const padding = 10;
    // const maxLineWidth = Math.max(...lines.map(line => line.length)) * 7; // Approximate character width
    // const tooltipWidth = Math.max(maxLineWidth + padding * 2, 150);
    const tooltipHeight = lines.length * lineHeight + padding * 2;

    return (
        <Label x={x + 20} y={y - tooltipHeight / 2}>
            <Tag
                fill="rgba(0, 0, 0, 0.9)"
                cornerRadius={6}
                shadowColor="black"
                shadowBlur={10}
                shadowOpacity={0.5}
                shadowOffsetX={2}
                shadowOffsetY={2}
            />
            <Group>
                {lines.map((line, index) => (
                    <Text
                        key={index}
                        x={padding}
                        y={padding + index * lineHeight}
                        text={line}
                        fontSize={12}
                        fill="white"
                        fontFamily="Arial"
                    />
                ))}
            </Group>
        </Label>
    );
});

InfoTooltip.displayName = 'InfoTooltip';

export default InfoTooltip;
