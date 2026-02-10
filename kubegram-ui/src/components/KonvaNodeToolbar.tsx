import React, { memo, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { GraphQL } from '@/lib/graphql-client';

// Legacy icons
import lbIcon from '@/assets/icons/lb.svg';
import loggerIcon from '@/assets/icons/logger.svg';
import configIcon from '@/assets/icons/config.svg';
import monitorIcon from '@/assets/icons/monitor.svg';
import secretIcon from '@/assets/icons/secret.svg';
import serviceIcon from '@/assets/icons/service.svg';

/**
 * Available node types that can be dragged onto the Konva canvas
 * Each type has an icon path and a type identifier
 */
const legacyNodeTypes = [
  { type: 'LoadBalancer', label: 'Load Balancer', icon: lbIcon },
  { type: 'Logger', label: 'Logger', icon: loggerIcon },
  { type: 'Config', label: 'Config', icon: configIcon },
  { type: 'Monitor', label: 'Monitor', icon: monitorIcon },
  { type: 'Secret', label: 'Secret', icon: secretIcon },
  { type: 'Service', label: 'Service', icon: serviceIcon },
];

const k8sNodeTypes = [
  // Core
  { type: 'Pod', label: 'Pod', icon: '/kubernetes/resources/unlabeled/pod.svg' },
  { type: 'Service', label: 'Service', icon: '/kubernetes/resources/unlabeled/svc.svg' },
  { type: 'Namespace', label: 'Namespace', icon: '/kubernetes/resources/unlabeled/ns.svg' },
  { type: 'Node', label: 'Node', icon: '/kubernetes/resources/unlabeled/node.svg' },
  { type: 'ConfigMap', label: 'ConfigMap', icon: '/kubernetes/resources/unlabeled/cm.svg' },
  { type: 'Secret', label: 'Secret', icon: '/kubernetes/resources/unlabeled/secret.svg' },
  { type: 'ServiceAccount', label: 'ServiceAccount', icon: '/kubernetes/resources/unlabeled/sa.svg' },
  { type: 'PersistentVolume', label: 'PV', icon: '/kubernetes/resources/unlabeled/pv.svg' },
  { type: 'PersistentVolumeClaim', label: 'PVC', icon: '/kubernetes/resources/unlabeled/pvc.svg' },
  { type: 'Event', label: 'Event', icon: '/kubernetes/resources/unlabeled/event.svg' },
  { type: 'LimitRange', label: 'LimitRange', icon: '/kubernetes/resources/unlabeled/limits.svg' },
  { type: 'ResourceQuota', label: 'ResourceQuota', icon: '/kubernetes/resources/unlabeled/quota.svg' },
  { type: 'ReplicationController', label: 'RC', icon: '/kubernetes/resources/unlabeled/rc.svg' },
  { type: 'Endpoints', label: 'Endpoints', icon: '/kubernetes/resources/unlabeled/ep.svg' },
  { type: 'Binding', label: 'Binding', icon: '/kubernetes/resources/unlabeled/binding.svg' },

  // Apps
  { type: 'Deployment', label: 'Deployment', icon: '/kubernetes/resources/unlabeled/deploy.svg' },
  { type: 'StatefulSet', label: 'StatefulSet', icon: '/kubernetes/resources/unlabeled/sts.svg' },
  { type: 'DaemonSet', label: 'DaemonSet', icon: '/kubernetes/resources/unlabeled/ds.svg' },
  { type: 'ReplicaSet', label: 'ReplicaSet', icon: '/kubernetes/resources/unlabeled/rs.svg' },

  // Batch
  { type: 'Job', label: 'Job', icon: '/kubernetes/resources/unlabeled/job.svg' },
  { type: 'CronJob', label: 'CronJob', icon: '/kubernetes/resources/unlabeled/cronjob.svg' },

  // Networking
  { type: 'Ingress', label: 'Ingress', icon: '/kubernetes/resources/unlabeled/ing.svg' },
  { type: 'NetworkPolicy', label: 'NetPol', icon: '/kubernetes/resources/unlabeled/netpol.svg' },

  // RBAC
  { type: 'Role', label: 'Role', icon: '/kubernetes/resources/unlabeled/role.svg' },
  { type: 'RoleBinding', label: 'RoleBinding', icon: '/kubernetes/resources/unlabeled/rb.svg' },

  // Storage
  { type: 'StorageClass', label: 'StorageClass', icon: '/kubernetes/resources/unlabeled/sc.svg' },
  { type: 'Volume', label: 'Volume', icon: '/kubernetes/resources/unlabeled/vol.svg' },

  // Policy
  { type: 'PodSecurityPolicy', label: 'PSP', icon: '/kubernetes/resources/unlabeled/psp.svg' },

  // Custom
  { type: 'CustomResourceDefinition', label: 'CRD', icon: '/kubernetes/resources/unlabeled/crd.svg' },
  { type: 'Group', label: 'Group', icon: '/kubernetes/resources/unlabeled/group.svg' },
  { type: 'User', label: 'User', icon: '/kubernetes/resources/unlabeled/user.svg' },
  { type: 'HorizontalPodAutoscaler', label: 'HPA', icon: '/kubernetes/resources/unlabeled/hpa.svg' },
];

/**
 * KonvaNodeToolbar Component Props
 */
interface KonvaNodeToolbarProps {
  isCollapsed?: boolean;
  graphType?: GraphQL.GraphType;
}

/**
 * KonvaNodeToolbar Component
 *
 * Provides draggable node buttons that users can drag onto the Konva canvas
 * to create new nodes. This toolbar is specifically designed for the Konva canvas implementation.
 *
 * Features:
 * - Draggable node buttons with visual feedback
 * - Clear instructions for users
 * - Responsive design with hover states
 * - Positioned to hover over the canvas
 * - Collapsible for more screen space
 * - Searchable icons for Kubernetes graphs
 */
const KonvaNodeToolbar: React.FC<KonvaNodeToolbarProps> = memo(({ isCollapsed = false, graphType }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const isK8sGraph = graphType === GraphQL.GraphType.Infrastructure;

  const displayNodes = useMemo(() => {
    let nodes = isK8sGraph ? k8sNodeTypes : legacyNodeTypes;

    if (searchTerm) {
      nodes = nodes.filter(node =>
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return nodes;
  }, [isK8sGraph, searchTerm]);

  /**
   * Handle the start of a drag operation
   * Sets the drag data and provides visual feedback
   */
  const handleDragStart = (
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
  };

  /**
   * Handle the end of a drag operation
   * Restores visual feedback to normal state
   */
  const handleDragEnd = (e: React.DragEvent) => {
    // Remove visual feedback by restoring opacity
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  };

  return (
    <div
      className={`absolute top-4 left-4 z-50 rounded-lg bg-card/95 backdrop-blur-sm p-3 shadow-lg border
                   flex flex-col gap-3 items-center transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-28'
        } max-h-[80vh] overflow-hidden`}
    >
      {/* Search Bar - Only show for K8s graphs and when not collapsed */}
      {!isCollapsed && isK8sGraph && (
        <div className="w-full relative px-1">
          <Input
            className="h-8 text-xs pr-7 pl-2"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="h-3 w-3 absolute right-3 top-2.5 text-muted-foreground" />
        </div>
      )}

      {/* Draggable node buttons container */}
      <div className="flex flex-col gap-3 items-center overflow-y-auto w-full no-scrollbar py-1">
        {displayNodes.map((item) => (
          <Button
            key={item.type}
            draggable
            onDragStart={(e) => handleDragStart(e, item.type, item.label, item.icon)}
            onDragEnd={handleDragEnd}
            variant="ghost"
            className="h-14 w-14 p-0 shrink-0 cursor-grab active:cursor-grabbing hover:bg-accent text-foreground flex items-center justify-center"
            title={`Drag to add ${item.label} node. Click and drag from any node to create connections.`}
          >
            <img src={item.icon} alt={item.label} className="w-10 h-10 object-contain" />
          </Button>
        ))}
        {displayNodes.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-2">No results</div>
        )}
      </div>
    </div>
  );
});

KonvaNodeToolbar.displayName = 'KonvaNodeToolbar';

export default KonvaNodeToolbar;
