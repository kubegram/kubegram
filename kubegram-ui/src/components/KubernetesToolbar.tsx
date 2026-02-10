import { Button } from '@/components/ui/button';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
} from 'lucide-react';
import React, { memo, useCallback, useState } from 'react';

/**
 * KubernetesToolbar Component Props
 */
interface KubernetesToolbarProps {
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

/**
 * KubernetesToolbar Component
 *
 * A specialized toolbar for Kubernetes-related node types.
 * Provides draggable icons for Kubernetes resources.
 */
const KubernetesToolbar: React.FC<KubernetesToolbarProps> = memo(
    ({
        isCollapsed = false,
        onToggleCollapse,
    }) => {
        const [showAllIcons, setShowAllIcons] = useState(false);

        const handleToggleShowAll = useCallback(() => {
            setShowAllIcons(!showAllIcons);
        }, [showAllIcons]);

        /**
         * Handle the start of a drag operation for service icons
         * Sets the drag data and provides visual feedback
         */
        const handleDragStart = useCallback((
            e: React.DragEvent,
            nodeType: string,
            nodeLabel: string,
            nodeIcon: string,
        ) => {
            // Set the node data for the drop handler
            e.dataTransfer.setData('node-type', nodeType);
            e.dataTransfer.setData('node-label', nodeLabel);
            e.dataTransfer.setData('node-icon', nodeIcon);
            e.dataTransfer.effectAllowed = 'copy';

            // Add visual feedback by reducing opacity
            const target = e.target as HTMLElement;
            target.style.opacity = '0.5';
        }, []);

        /**
         * Handle the end of a drag operation for service icons
         * Restores visual feedback to normal state
         */
        const handleDragEnd = useCallback((e: React.DragEvent) => {
            // Remove visual feedback by restoring opacity
            const target = e.target as HTMLElement;
            target.style.opacity = '1';
        }, []);

        // Define Kubernetes resource icons
        const kubernetesIcons = [
            { id: 'logger', title: 'Logger', src: '/logger-canvas.svg', alt: 'Logger', nodeType: 'Logger', nodeLabel: 'Logger' },
            { id: 'secret', title: 'Secret', src: '/secret-canvas.svg', alt: 'Secret', nodeType: 'Secret', nodeLabel: 'Secret' },
            { id: 'monitor', title: 'Monitor', src: '/monitor-canvas.svg', alt: 'Monitor', nodeType: 'Monitor', nodeLabel: 'Monitor' },
            { id: 'service', title: 'Service', src: '/service-canvas.svg', alt: 'Service', nodeType: 'Service', nodeLabel: 'Service' },
            { id: 'config', title: 'Config', src: '/config-canvas.svg', alt: 'Config', nodeType: 'Config', nodeLabel: 'Config' },
            { id: 'lb', title: 'Load Balancer', src: '/lb-canvas.svg', alt: 'Load Balancer', nodeType: 'LoadBalancer', nodeLabel: 'Load Balancer' },
            { id: 'nginx', title: 'Nginx', src: '/nginx.svg', alt: 'Nginx', nodeType: 'Nginx', nodeLabel: 'Nginx' },
            { id: 'linkerd', title: 'Linkerd', src: '/linkerd.svg', alt: 'Linkerd', nodeType: 'Linkerd', nodeLabel: 'Linkerd' },
            { id: 'traefik', title: 'Traefik', src: '/traefik_proxy.svg', alt: 'Traefik', nodeType: 'Traefik', nodeLabel: 'Traefik' },
        ];

        // Show first 3 icons by default, or all if expanded
        const visibleIcons = showAllIcons ? kubernetesIcons : kubernetesIcons.slice(0, 3);

        return (
            <div
                className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 p-3
                   flex flex-row items-center gap-4"
                style={{ backgroundColor: '#2e2e2eff' }}
            >
                {/* Collapse Toggle Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleCollapse}
                    className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-300"
                    title={isCollapsed ? 'Expand Toolbar' : 'Collapse Toolbar'}
                >
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </Button>

                {/* Toolbar Content - Only show when not collapsed */}
                {!isCollapsed && (
                    <>
                        {/* Service Icons */}
                        <div className="flex items-center gap-2">
                            {visibleIcons.map((icon) => (
                                <Button
                                    key={icon.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, icon.nodeType, icon.nodeLabel, icon.src)}
                                    onDragEnd={handleDragEnd}
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 w-10 p-1 hover:bg-gray-700 text-gray-300 cursor-grab active:cursor-grabbing"
                                    title={`Drag to add ${icon.nodeLabel} node`}
                                >
                                    <img src={icon.src} alt={icon.alt} className="w-10 h-10" />
                                </Button>
                            ))}
                        </div>

                        {/* Right Chevron - Show only if there are more icons to display */}
                        {kubernetesIcons.length > 3 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleToggleShowAll}
                                className="h-12 w-12 p-0 hover:bg-gray-700 text-gray-300"
                                title={showAllIcons ? 'Show Less' : 'Show More'}
                            >
                                {showAllIcons ? <ChevronLeft className="w-12 h-12" /> : <ChevronRight className="w-8 h-8" />}
                            </Button>
                        )}
                    </>
                )}
            </div>
        );
    },
);

KubernetesToolbar.displayName = 'KubernetesToolbar';

export default KubernetesToolbar;
