import type {
   JsonCanvas,
   NodeSide,
 } from '@/types/jsoncanvas';

export interface RenderArrow {
  id: string;
  startNodeId: string;
  endNodeId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  label?: string;
  pathMode?: 'straight' | 'square' | 'curved';
}

export interface RenderNode {
  id: string;
  type: string;
  label: string;
  iconSrc: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  companyId: string;
  name: string;
  nodeType: string;
  userId: string;
}

const DEFAULT_ICON = '/kubernetes/resources/unlabeled/pod.svg';

// Simple frontmatter parser for nodes with metadata
function parseFrontmatter(text: string): { metadata: Record<string, string>, body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = text.match(frontmatterRegex);
  
  if (!match) {
    return { metadata: {}, body: text };
  }
  
  const frontmatterLines = match[1].split('\n');
  const metadata: Record<string, string> = {};
  
  frontmatterLines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      metadata[key] = value;
    }
  });
  
  return { metadata, body: match[2] };
}

export function jsonCanvasToRenderModel(jc: JsonCanvas): {
  nodes: RenderNode[];
  arrows: RenderArrow[];
} {
  const nodeMap = new Map<string, RenderNode>();

  const nodes: RenderNode[] = (jc.nodes || []).map((jcNode) => {
    let label = jcNode.id;
    let k8sType = 'Pod';
    let iconSrc = DEFAULT_ICON;
    let nodeType = 'POD';

    if (jcNode.type === 'text') {
      const { metadata, body } = parseFrontmatter((jcNode as any).text);
      label = body || jcNode.id;
      if (metadata['k8s-type']) k8sType = metadata['k8s-type'];
      if (metadata['icon']) iconSrc = metadata['icon'];
      if (metadata['nodeType']) nodeType = metadata['nodeType'];
    }

    const renderNode: RenderNode = {
      id: jcNode.id,
      type: k8sType,
      label,
      iconSrc,
      x: jcNode.x,
      y: jcNode.y,
      width: jcNode.width,
      height: jcNode.height,
      color: (jcNode as any).color,
      companyId: '',
      name: label,
      nodeType,
      userId: '',
    };

    nodeMap.set(jcNode.id, renderNode);
    return renderNode;
  });

  const arrows: RenderArrow[] = (jc.edges || [])
    .filter((edge) => {
      // Skip edges referencing non-existent nodes to prevent (0,0) rendering
      return nodeMap.has(edge.fromNode) && nodeMap.has(edge.toNode);
    })
    .map((edge) => {
      const from = nodeMap.get(edge.fromNode)!;
      const to = nodeMap.get(edge.toNode)!;

      // Use edge sides if specified, otherwise default to 'right' for start and 'left' for end
      const fromSide = edge.fromSide || 'right';
      const toSide = edge.toSide || 'left';

      const startPoint = getConnectionPoint(from, fromSide);
      const endPoint = getConnectionPoint(to, toSide);

      return {
        id: edge.id,
        startNodeId: edge.fromNode,
        endNodeId: edge.toNode,
        startX: startPoint.x,
        startY: startPoint.y,
        endX: endPoint.x,
        endY: endPoint.y,
        label: edge.label,
        pathMode: edge.pathMode,
      };
    });

  return { nodes, arrows };
}

function getConnectionPoint(
  node: { x: number; y: number; width: number; height: number },
  side: NodeSide,
): { x: number; y: number } {
  switch (side) {
    case 'top':
      return { x: node.x + node.width / 2, y: node.y };
    case 'bottom':
      return { x: node.x + node.width / 2, y: node.y + node.height };
    case 'left':
      return { x: node.x, y: node.y + node.height / 2 };
    case 'right':
      return { x: node.x + node.width, y: node.y + node.height / 2 };
  }
}

export function exportToCanvasFile(data: JsonCanvas, filename = 'kubegram.canvas'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importCanvasFile(file: File): Promise<JsonCanvas> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content) as JsonCanvas;
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}