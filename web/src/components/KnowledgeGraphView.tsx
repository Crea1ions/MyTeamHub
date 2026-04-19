import React from 'react';
import { ZoomIn, ZoomOut, Square } from 'lucide-react';
import type { KnowledgeGraph, GraphNode } from '../types/index';
import styles from './KnowledgeGraphView.module.css';

export interface KnowledgeGraphViewProps {
  graph: KnowledgeGraph;
  selectedNodeId?: string;
  onNodeClick: (nodeId: string) => void;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  graph,
  selectedNodeId,
  onNodeClick,
}) => {
  const [zoom, setZoom] = React.useState(1);

  const width = 800;
  const height = 600;

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom((z) => (direction === 'in' ? Math.min(z + 0.2, 3) : Math.max(z - 0.2, 0.5)));
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'note':
        return '#4c8dff';
      case 'session':
        return '#2ee59d';
      case 'output':
        return '#ffcc66';
      case 'agent':
        return '#ff5c7a';
      default:
        return '#8b98a5';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Knowledge Graph</h2>
        <div className={styles.controls}>
          <button onClick={() => handleZoom('in')} title="Zoom in">
            <ZoomIn size={16} />
          </button>
          <button onClick={() => handleZoom('out')} title="Zoom out">
            <ZoomOut size={16} />
          </button>
          <button onClick={() => setZoom(1)} title="Reset">
            <Square size={16} />
          </button>
        </div>
      </div>

      <div className={styles.canvas}>
        <svg
          width={width}
          height={height}
          style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}
          className={styles.graph}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#243244" />
            </marker>
          </defs>

          {/* Draw edges */}
          {graph.edges.map((edge) => {
            const source = graph.nodes.find((n) => n.id === edge.source);
            const target = graph.nodes.find((n) => n.id === edge.target);

            if (!source || !target) return null;

            return (
              <line
                key={edge.id}
                x1={source.position.x}
                y1={source.position.y}
                x2={target.position.x}
                y2={target.position.y}
                stroke="#243244"
                strokeWidth="1"
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {/* Draw nodes */}
          {graph.nodes.map((node) => (
            <g key={node.id} onClick={() => onNodeClick(node.id)}>
              <circle
                cx={node.position.x}
                cy={node.position.y}
                r="25"
                fill={getNodeColor(node.type)}
                stroke={node.id === selectedNodeId ? '#4c8dff' : 'transparent'}
                strokeWidth={node.id === selectedNodeId ? '2' : '0'}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              />
              <text
                x={node.position.x}
                y={node.position.y}
                textAnchor="middle"
                dy="0.3em"
                fill="#0b0f14"
                fontSize="11"
                fontWeight="bold"
                pointerEvents="none"
              >
                {node.label.substring(0, 2)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div
            className={styles.legendDot}
            style={{ backgroundColor: '#4c8dff' }}
          />
          <span>Notes</span>
        </div>
        <div className={styles.legendItem}>
          <div
            className={styles.legendDot}
            style={{ backgroundColor: '#2ee59d' }}
          />
          <span>Sessions</span>
        </div>
        <div className={styles.legendItem}>
          <div
            className={styles.legendDot}
            style={{ backgroundColor: '#ffcc66' }}
          />
          <span>Outputs</span>
        </div>
        <div className={styles.legendItem}>
          <div
            className={styles.legendDot}
            style={{ backgroundColor: '#ff5c7a' }}
          />
          <span>Agents</span>
        </div>
      </div>
    </div>
  );
};
