import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { GraphNode, GraphEdge } from '../types/index';
import styles from './GraphViewer.module.css';

export interface GraphViewerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  selectedNodeId?: string;
}

interface D3Node extends GraphNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface D3Edge extends GraphEdge {
  source: D3Node | string;
  target: D3Node | string;
}

export const GraphViewer: React.FC<GraphViewerProps> = ({
  nodes,
  edges,
  onNodeClick,
  onNodeHover,
  selectedNodeId,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const simulationRef = useRef<d3.Simulation<D3Node, D3Edge> | null>(null);
  const tickCountRef = useRef(0);
  const lastRenderRef = useRef(0);

  // Update dimensions on mount/resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current?.parentElement) {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Create and update graph
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const { width, height } = dimensions;

    // Prepare data
    const d3Nodes: D3Node[] = nodes.map((node) => ({
      ...node,
      x: Math.random() * width,
      y: Math.random() * height,
      fx: null,
      fy: null,
    }));

    const d3Edges: D3Edge[] = edges
      .filter(edge => {
        // Filter out edges with invalid node references
        return nodes.some(n => n.id === edge.source) && nodes.some(n => n.id === edge.target);
      })
      .map((edge) => ({
        ...edge,
        source: d3Nodes.find((n) => n.id === edge.source) || edge.source,
        target: d3Nodes.find((n) => n.id === edge.target) || edge.target,
      }));

    // Create SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous

    // Add zoom behavior
    const g = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
    svg.call(zoom);

    // Create force simulation
    const simulation = d3
      .forceSimulation<D3Node, D3Edge>(d3Nodes)
      .force(
        'link',
        d3
          .forceLink<D3Node, D3Edge>(d3Edges)
          .id((d) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody<D3Node>().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .alphaMin(0.001) // Convergence threshold for performance
      .velocityDecay(0.4); // Higher decay = faster convergence

    simulationRef.current = simulation;

    // Create edge elements
    const links = g
      .selectAll('line')
      .data(d3Edges)
      .enter()
      .append('line')
      .attr('class', styles.link)
      .attr('stroke', (d) => {
        // Color by edge type
        switch (d.type) {
          case 'references':
            return '#3b82f6'; // Blue
          case 'referenced_by':
            return '#10b981'; // Green
          case 'tags':
            return '#f59e0b'; // Amber
          case 'related':
            return '#8b5cf6'; // Purple
          default:
            return '#999';
        }
      })
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .append('title')
      .text((d) => `${d.type}: ${d.source instanceof Object ? (d.source as D3Node).label : d.source} → ${d.target instanceof Object ? (d.target as D3Node).label : d.target}`);

    // Create node elements
    const nodeGroups = g
      .selectAll('g.node')
      .data(d3Nodes)
      .enter()
      .append('g')
      .attr('class', styles.nodeGroup)
      .call(
        d3
          .drag<SVGGElement, D3Node>()
          .on('start', dragStarted)
          .on('drag', dragged)
          .on('end', dragEnded)
      );

    // Add circles for nodes
    nodeGroups
      .append('circle')
      .attr('r', 8)
      .attr('class', (d) =>
        d.id === selectedNodeId ? styles.nodeSelected : styles.node
      )
      .attr('fill', (d) => {
        // Color by type
        switch (d.type) {
          case 'project':
            return '#8b5cf6'; // Purple
          case 'note':
            return '#3b82f6'; // Blue
          case 'output':
            return '#10b981'; // Green
          case 'session':
            return '#f59e0b'; // Amber
          default:
            return '#6b7280'; // Gray
        }
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d.id);
      })
      .on('mouseenter', (event, d) => {
        onNodeHover?.(d.id);
      })
      .on('mouseleave', () => {
        onNodeHover?.(null);
      });

    // Add labels for nodes
    nodeGroups
      .append('text')
      .attr('class', styles.nodeLabel)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('font-size', '12px')
      .attr('fill', '#fff')
      .text((d) => d.label.substring(0, 10)); // Truncate long labels

    // Update positions on simulation tick with throttling (60fps)
    const renderInterval = 1000 / 60; // ~16.67ms for 60fps
    simulation.on('tick', () => {
      const now = performance.now();
      if (now - lastRenderRef.current < renderInterval) return; // Throttle
      lastRenderRef.current = now;

      // Update edge positions (only visible edges)
      links.attr('x1', (d) => (d.source as D3Node).x || 0).attr('y1', (d) => (d.source as D3Node).y || 0).attr('x2', (d) => (d.target as D3Node).x || 0).attr('y2', (d) => (d.target as D3Node).y || 0);

      // Update node positions with culling for performance
      nodeGroups.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Convergence detection for performance
    simulation.on('end', () => {
      console.log('⚡ Force simulation converged - stopping');
    });

    // Drag functions
    function dragStarted(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragEnded(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Reset zoom on mount
    svg.transition().duration(750).call(
      zoom.transform as any,
      d3.zoomIdentity.translate(0, 0).scale(1)
    );

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, dimensions, onNodeClick, onNodeHover, selectedNodeId]);

  return (
    <div className={styles.container}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className={styles.svg}
      />
      <div className={styles.info}>
        <small>💡 Drag nodes • Scroll to zoom • Click to select</small>
      </div>
    </div>
  );
};
