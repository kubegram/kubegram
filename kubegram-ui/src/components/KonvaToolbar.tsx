import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
  RotateCcw,
  Minus,
  MoreHorizontal,
  MoveRight,
  ShieldAlert,
  ArrowBigRight,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedArrowType } from '@/store/slices/canvas/activitySlice';
import React, { memo, useCallback, useState } from 'react';

/**
 * KonvaToolbar Component Props
 */
interface KonvaToolbarProps {
  isArrowMode?: boolean;
  onToggleArrowMode?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onRestore?: () => void;
  canRestore?: boolean;
  onToggleAISuggestions?: () => void;
  isAISuggestionsEnabled?: boolean;
}

/**
 * KonvaToolbar Component
 *
 * A floating toolbar specifically designed for the Konva canvas.
 * Provides tools for canvas manipulation, zoom, and node operations.
 */
const KonvaToolbar: React.FC<KonvaToolbarProps> = memo(
  ({
    isArrowMode = false,
    onToggleArrowMode,
    isCollapsed = false,
    onToggleCollapse,
    onRestore,
    canRestore = false,
    onToggleAISuggestions,
    isAISuggestionsEnabled = true,
  }) => {
    const [showAllIcons, setShowAllIcons] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeNodeSet, setActiveNodeSet] = useState<'abstract' | 'k8s'>('abstract');

    const dispatch = useAppDispatch();
    const selectedArrowType = useAppSelector((state) => state.canvas.activity.selectedArrowType);

    const handleToggleArrowMode = useCallback(() => {
      if (onToggleArrowMode) {
        onToggleArrowMode();
      }
    }, [onToggleArrowMode]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    }, []);

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

    // Define all service icons with node type information
    const allServiceIcons = [
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

    const k8sNodeTypes = [
      // Core
      { type: 'Pod', title: 'Pod', icon: '/kubernetes/resources/unlabeled/pod.svg' },
      { type: 'Service', title: 'Service', icon: '/kubernetes/resources/unlabeled/svc.svg' },
      { type: 'Namespace', title: 'Namespace', icon: '/kubernetes/resources/unlabeled/ns.svg' },
      { type: 'Node', title: 'Node', icon: '/kubernetes/resources/unlabeled/node.svg' },
      { type: 'ConfigMap', title: 'ConfigMap', icon: '/kubernetes/resources/unlabeled/cm.svg' },
      { type: 'Secret', title: 'Secret', icon: '/kubernetes/resources/unlabeled/secret.svg' },
      { type: 'ServiceAccount', title: 'ServiceAccount', icon: '/kubernetes/resources/unlabeled/sa.svg' },
      { type: 'PersistentVolume', title: 'PV', icon: '/kubernetes/resources/unlabeled/pv.svg' },
      { type: 'PersistentVolumeClaim', title: 'PVC', icon: '/kubernetes/resources/unlabeled/pvc.svg' },
      { type: 'Event', title: 'Event', icon: '/kubernetes/resources/unlabeled/event.svg' },
      { type: 'LimitRange', title: 'LimitRange', icon: '/kubernetes/resources/unlabeled/limits.svg' },
      { type: 'ResourceQuota', title: 'ResourceQuota', icon: '/kubernetes/resources/unlabeled/quota.svg' },
      { type: 'ReplicationController', title: 'RC', icon: '/kubernetes/resources/unlabeled/rc.svg' },
      { type: 'Endpoints', title: 'Endpoints', icon: '/kubernetes/resources/unlabeled/ep.svg' },
      { type: 'Binding', title: 'Binding', icon: '/kubernetes/resources/unlabeled/binding.svg' },

      // Apps
      { type: 'Deployment', title: 'Deployment', icon: '/kubernetes/resources/unlabeled/deploy.svg' },
      { type: 'StatefulSet', title: 'StatefulSet', icon: '/kubernetes/resources/unlabeled/sts.svg' },
      { type: 'DaemonSet', title: 'DaemonSet', icon: '/kubernetes/resources/unlabeled/ds.svg' },
      { type: 'ReplicaSet', title: 'ReplicaSet', icon: '/kubernetes/resources/unlabeled/rs.svg' },

      // Batch
      { type: 'Job', title: 'Job', icon: '/kubernetes/resources/unlabeled/job.svg' },
      { type: 'CronJob', title: 'CronJob', icon: '/kubernetes/resources/unlabeled/cronjob.svg' },

      // Networking
      { type: 'Ingress', title: 'Ingress', icon: '/kubernetes/resources/unlabeled/ing.svg' },
      { type: 'NetworkPolicy', title: 'NetPol', icon: '/kubernetes/resources/unlabeled/netpol.svg' },

      // RBAC
      { type: 'Role', title: 'Role', icon: '/kubernetes/resources/unlabeled/role.svg' },
      { type: 'RoleBinding', title: 'RoleBinding', icon: '/kubernetes/resources/unlabeled/rb.svg' },

      // Storage
      { type: 'StorageClass', title: 'StorageClass', icon: '/kubernetes/resources/unlabeled/sc.svg' },
      { type: 'Volume', title: 'Volume', icon: '/kubernetes/resources/unlabeled/vol.svg' },

      // Policy
      { type: 'PodSecurityPolicy', title: 'PSP', icon: '/kubernetes/resources/unlabeled/psp.svg' },

      // Custom
      { type: 'CustomResourceDefinition', title: 'CRD', icon: '/kubernetes/resources/unlabeled/crd.svg' },
      { type: 'Group', title: 'Group', icon: '/kubernetes/resources/unlabeled/group.svg' },
      { type: 'User', title: 'User', icon: '/kubernetes/resources/unlabeled/user.svg' },
      { type: 'HorizontalPodAutoscaler', title: 'HPA', icon: '/kubernetes/resources/unlabeled/hpa.svg' },
    ];

    // Normalise both sets into a common shape for filtering and rendering
    const activeIcons = activeNodeSet === 'abstract'
      ? allServiceIcons.map(i => ({ id: i.id, title: i.title, src: i.src, nodeType: i.nodeType, nodeLabel: i.nodeLabel }))
      : k8sNodeTypes.map(i => ({ id: i.type, title: i.title, src: i.icon, nodeType: i.type, nodeLabel: i.title }));

    const filteredIcons = activeIcons.filter(icon =>
      icon.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Show first 3 icons by default, or all if expanded or searching
    const visibleIcons = showAllIcons || searchTerm ? filteredIcons : filteredIcons.slice(0, 3);

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
            {/* Node set toggle */}
            <div className="flex items-center gap-1 border-r border-gray-600 pr-3 mr-1">
              <Button
                size="sm"
                variant="ghost"
                className={`h-7 px-2 text-xs ${activeNodeSet === 'abstract' ? 'bg-purple-500/30 text-purple-300' : 'text-gray-400'}`}
                onClick={() => { setActiveNodeSet('abstract'); setShowAllIcons(false); setSearchTerm(''); }}
                title="Custom service nodes"
              >
                Services
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={`h-7 px-2 text-xs ${activeNodeSet === 'k8s' ? 'bg-purple-500/30 text-purple-300' : 'text-gray-400'}`}
                onClick={() => { setActiveNodeSet('k8s'); setShowAllIcons(false); setSearchTerm(''); }}
                title="Kubernetes resource nodes"
              >
                K8s
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Input
                placeholder="search"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-32 h-8 bg-gray-700 border-gray-600 text-gray-300 placeholder-gray-400 rounded-full pl-8 pr-3 text-sm"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
            </div>

            {/* Purple Arrow Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleArrowMode}
              className={`h-10 w-10 p-0 hover:bg-gray-700 ${isArrowMode ? 'text-purple-400 bg-purple-400/20' : 'text-gray-300'
                }`}
              title={isArrowMode ? 'Exit Arrow Mode' : 'Enter Arrow Mode'}
            >
              <ArrowRight className="w-10 h-10" />
            </Button>

            {/* Arrow Style Selection - Only show when in Arrow Mode */}
            {isArrowMode && (
              <div className="flex items-center gap-1 border-l border-r border-gray-600 px-2 mx-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch(setSelectedArrowType('SOLID'))}
                  className={`h-8 w-8 p-0 hover:bg-gray-700 ${selectedArrowType === 'SOLID' ? 'bg-purple-500/30 text-purple-300' : 'text-gray-300'}`}
                  title="Solid Arrow"
                >
                  <MoveRight className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch(setSelectedArrowType('DASHED'))}
                  className={`h-8 w-8 p-0 hover:bg-gray-700 ${selectedArrowType === 'DASHED' ? 'bg-purple-500/30 text-purple-300' : 'text-gray-300'}`}
                  title="Dashed Arrow"
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch(setSelectedArrowType('DOTTED'))}
                  className={`h-8 w-8 p-0 hover:bg-gray-700 ${selectedArrowType === 'DOTTED' ? 'bg-purple-500/30 text-purple-300' : 'text-gray-300'}`}
                  title="Dotted Arrow"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch(setSelectedArrowType('THICK'))}
                  className={`h-8 w-8 p-0 hover:bg-gray-700 ${selectedArrowType === 'THICK' ? 'bg-purple-500/30 text-purple-300' : 'text-gray-300'}`}
                  title="Thick Arrow (Data Flow)"
                >
                  <ArrowBigRight className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch(setSelectedArrowType('RED'))}
                  className={`h-8 w-8 p-0 hover:bg-gray-700 ${selectedArrowType === 'RED' ? 'bg-red-500/30 text-red-400' : 'text-gray-300'}`}
                  title="Red Arrow (Security Boundary)"
                >
                  <ShieldAlert className="w-4 h-4" />
                </Button>
              </div>
            )}

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
                  <img src={icon.src} alt={icon.title} className="w-10 h-10" />
                </Button>
              ))}
            </div>

            {/* Code Generation Button Removed - Moved to AI Assistant */}

            {/* Restore/Undo Button - Only show if restore is available */}
            {canRestore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRestore}
                className="h-8 w-8 p-0 hover:bg-gray-700 text-orange-400 hover:text-orange-300"
                title="Undo: Restore Previous Graph"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}

            {/* Right Chevron - Show only if there are more icons to display */}
            {!searchTerm && filteredIcons.length > 3 && (
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

            {/* AI Suggestions Toggle */}
            {onToggleAISuggestions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleAISuggestions}
                className={`h-8 w-8 p-0 hover:bg-gray-700 ${isAISuggestionsEnabled ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-500'}`}
                title={isAISuggestionsEnabled ? 'Disable AI Suggestions' : 'Enable AI Suggestions'}
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </Button>
            )}
          </>
        )}
      </div>
    );
  },
);

KonvaToolbar.displayName = 'KonvaToolbar';

export default KonvaToolbar;
