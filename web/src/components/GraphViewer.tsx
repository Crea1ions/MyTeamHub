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
  const visibleNodesRef = useRef<Set<string>>(new Set());
  const [largeDataset, setLargeDataset] = useState(false);
  const nodeGroupsRef = useRef<d3.Selection<SVGGElement, D3Node, SVGGElement, unknown> | null>(null);
  const linksRef = useRef<d3.Selection<SVGLineElement, D3Edge, SVGGElement, unknown> | null>(null);
  const d3NodesRef = useRef<D3Node[] | null>(null);
  const d3EdgesRef = useRef<D3Edge[] | null>(null);

  // Update dimensions on mount/resize using ResizeObserver for split-pane responsiveness
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current?.parentElement) {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    
    // Use ResizeObserver to track parent container resize (split-pane changes)
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    
    if (svgRef.current?.parentElement) {
      resizeObserver.observe(svgRef.current.parentElement);
    }
    
    // Also keep window resize for global window changes
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Memoize edge color class mapping function - based on edge type
  const getEdgeColorClass = React.useMemo(() => {
    return (edgeType?: string) => {
      switch (edgeType) {
        case 'references':
          return styles.linkReferences;
        case 'referenced_by':
          return styles.linkReferencedBy;
        case 'tags':
          return styles.linkTags;
        case 'related':
          return styles.linkRelated;
        default:
          return styles.link;
      }
    };
  }, []);

  // Memoize color class mapping function - category-based on file path
  const getNodeColorClass = React.useMemo(() => {
    return (node: GraphNode) => {
      const path = node.path || '';
      
      // Violet-rose: 00-Inbox/agent-dev/projects-dev/
      if (path.includes('00-Inbox/agent-dev/projects-dev/')) {
        return styles.nodeViolet;
      }
      // Red: 00-Inbox/agent-dev/ (but not projects-dev)
      if (path.includes('00-Inbox/agent-dev/') && !path.includes('projects-dev/')) {
        return styles.nodeRed;
      }
      // Yellow: 00-Inbox/agent-openclaw/ or openclaw/
      if (path.includes('00-Inbox/agent-openclaw/') || path.includes('openclaw/')) {
        return styles.nodeYellow;
      }
      // Green: 00-Inbox/myteam-studio/ or 20-Projects/myteamhub/ or myteam/
      if (
        path.includes('00-Inbox/myteam-studio/') ||
        path.includes('20-Projects/myteamhub/') ||
        path.includes('myteam/')
      ) {
        return styles.nodeGreen;
      }
      // Blue: System general (10-, 20-, 30-, etc. but NOT 00-)
      if (
        path.match(/^[1-9]\d-/) ||  // Numbered directories (10-, 20-, 30-, etc.) but not 00-
        path.includes('10-Context/') ||
        path.includes('30-Knowledge/') ||
        path.includes('40-Snippets/') ||
        path.includes('50-Tasks/') ||
        path.includes('60-State/') ||
        path.includes('70-Logs/') ||
        path.includes('80-Protocols/') ||
        path.includes('90-Indexes/')
      ) {
        return styles.nodeBlue;
      }
      // Default blue for other files
      return styles.nodeBlue;
    };
  }, []);

  // Create and update graph (optimize: only update when nodes/edges change, not on every render)
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const { width, height } = dimensions;
    const isLargeDataset = nodes.length > 100;
    setLargeDataset(isLargeDataset);

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

    // Add marker definitions for directional arrows (larger for visibility)
    const defs = svg.append('defs');
    const edgeTypes = ['references', 'referenced_by', 'tags', 'related'];
    const edgeColors: Record<string, string> = {
      references: '#3b82f6',      // Blue
      referenced_by: '#10b981',   // Green
      tags: '#f59e0b',            // Amber
      related: '#8b5cf6',         // Purple
    };

    // Create LARGER arrow markers for each edge type (increased size for visibility)
    Object.entries(edgeColors).forEach(([type, color]) => {
      // Use lighter, more visible colors for arrows
      const arrowColor = {
        'references': '#60a5fa',      // Lighter blue
        'referenced_by': '#34d399',   // Lighter green
        'tags': '#fbbf24',            // Lighter amber
        'related': '#a78bfa'          // Lighter purple
      }[type] || color;
      
      defs
        .append('marker')
        .attr('id', `arrow-${type}`)
        .attr('markerWidth', 40)      // Extra large
        .attr('markerHeight', 40)     // Extra large
        .attr('refX', 28)             // Position further from node
        .attr('refY', 20)             // Center
        .attr('orient', 'auto')
        .attr('markerUnits', 'strokeWidth')  // Scale with line width
        .append('polygon')
        .attr('points', '0 0, 40 20, 0 40')  // Bigger triangle
        .attr('fill', arrowColor)
        .attr('opacity', '1');        // Fully opaque
    });

    // Add zoom behavior with limits to prevent browser crash
    const g = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])  // Min zoom: 0.1x (10%), Max zoom: 10x (1000%) - Extended range
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Create force simulation with tuning for large datasets
    const simulation = d3
      .forceSimulation<D3Node, D3Edge>(d3Nodes)
      .force(
        'link',
        d3
          .forceLink<D3Node, D3Edge>(d3Edges)
          .id((d) => d.id)
          .distance(isLargeDataset ? 150 : 100) // Larger distance for large graphs
      )
      .force('charge', d3.forceManyBody<D3Node>().strength(isLargeDataset ? -200 : -300)) // Reduce for large graphs
      .force('center', d3.forceCenter(width / 2, height / 2))
      .alphaMin(isLargeDataset ? 0.005 : 0.001) // Faster convergence for large graphs
      .velocityDecay(isLargeDataset ? 0.6 : 0.4); // Higher decay for faster stabilization

    simulationRef.current = simulation;

    // Create edge elements with directional arrows
    const links = g
      .selectAll('line.edge')
      .data(d3Edges)
      .enter()
      .append('line')
      .attr('class', (d) => {
        // Map edge type to CSS class
        const edgeColorClass = getEdgeColorClass(d.type);
        return `${styles.link} ${edgeColorClass}`;
      })
      .attr('stroke', (d) => {
        // Ensure arrow color matches marker color
        const colorMap: Record<string, string> = {
          'references': '#60a5fa',
          'referenced_by': '#34d399',
          'tags': '#fbbf24',
          'related': '#a78bfa'
        };
        return colorMap[d.type] || '#60a5fa';
      })
      .attr('stroke-opacity', 1.0)    // Always fully opaque
      .attr('stroke-width', 3)        // Thicker lines
      .attr('marker-end', (d) => `url(#arrow-${d.type})`)
      .on('mouseenter', function() {
        d3.select(this).attr('stroke-opacity', 1).attr('stroke-width', 4);
      })
      .on('mouseleave', function() {
        d3.select(this).attr('stroke-opacity', 1).attr('stroke-width', 3);
      })
      .append('title')
      .text((d) => `${d.type}: ${d.source instanceof Object ? (d.source as D3Node).label : d.source} → ${d.target instanceof Object ? (d.target as D3Node).label : d.target}`);

    // Store references for selection updates (without restarting simulation)
    linksRef.current = links;

    // Create edge labels (only for larger screens)
    const edgeLabels = g
      .selectAll('text.edgeLabel')
      .data(d3Edges)
      .enter()
      .append('text')
      .attr('class', styles.edgeLabel)
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .attr('opacity', 0.7)
      .text((d) => {
        // Abbreviate link type for display
        const typeAbbr: Record<string, string> = {
          references: 'ref',
          referenced_by: 'by',
          tags: 'tag',
          related: 'rel',
        };
        return typeAbbr[d.type] || d.type;
      });

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

    // Add circles for nodes with category-based coloring using CSS classes
    // Calculate connection count for each node to scale size
    const connectionCount: Record<string, number> = {};
    d3Edges.forEach((edge) => {
      const source = edge.source as D3Node;
      const target = edge.target as D3Node;
      connectionCount[source.id] = (connectionCount[source.id] || 0) + 1;
      connectionCount[target.id] = (connectionCount[target.id] || 0) + 1;
    });

    nodeGroups
      .append('circle')
      .attr('r', (d) => {
        // Base size 10, scale up by connection count: +1 per 2 connections (max 16)
        const connections = connectionCount[d.id] || 0;
        const scaledRadius = Math.min(10 + Math.floor(connections / 2), 16);
        return scaledRadius;
      })
      .attr('class', (d) => {
        const baseClass = d.id === selectedNodeId ? styles.nodeSelected : styles.node;
        const colorClass = getNodeColorClass(d);
        return `${baseClass} ${colorClass}`;
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

    // Add labels for nodes (initially hidden, shown on hover/selection)
    nodeGroups
      .append('text')
      .attr('class', styles.nodeLabel)
      .attr('text-anchor', 'middle')
      .attr('dy', '-1.8em')
      .attr('font-size', '12px')
      .attr('fill', '#fff')
      .attr('opacity', 0) // Start hidden for clean view
      .text((d) => d.label.substring(0, 10)) // Truncate long labels
      .style('pointer-events', 'none'); // Don't interfere with clicks

    // Store references for selection updates (without restarting simulation)
    nodeGroupsRef.current = nodeGroups;
    d3NodesRef.current = d3Nodes;
    d3EdgesRef.current = d3Edges;

    // Show labels on hover and highlight connections
    nodeGroups
      .on('mouseenter', function(event, d) {
        const nodeId = d.id;
        
        // Show label
        d3.select(this)
          .select('text')
          .transition()
          .duration(150)
          .attr('opacity', 1);

        // Highlight connected edges
        links
          .attr('stroke-opacity', (edge) => {
            const source = edge.source as D3Node;
            const target = edge.target as D3Node;
            if (source.id === nodeId || target.id === nodeId) {
              return 0.8; // Connected edge - make visible
            }
            return 0.1; // Other edges - fade out
          })
          .attr('stroke-width', (edge) => {
            const source = edge.source as D3Node;
            const target = edge.target as D3Node;
            if (source.id === nodeId || target.id === nodeId) {
              return 2.5; // Connected edge - thicker
            }
            return 0.5; // Other edges - thinner
          });

        // Fade out other nodes
        nodeGroups
          .select('circle')
          .attr('opacity', (otherNode) => {
            if (otherNode.id === nodeId) return 1; // Current node
            const isConnected = d3Edges.some((edge) => {
              const source = edge.source as D3Node;
              const target = edge.target as D3Node;
              return (source.id === nodeId && target.id === otherNode.id) ||
                     (target.id === nodeId && source.id === otherNode.id);
            });
            return isConnected ? 1 : 0.2; // Connected or other
          });
      })
      .on('mouseleave', function(event, d) {
        // Keep label and highlights visible if node is selected
        const isSelected = d.id === selectedNodeId;
        
        if (!isSelected) {
          // Hide label only if not selected
          d3.select(this)
            .select('text')
            .transition()
            .duration(150)
            .attr('opacity', 0);

          // Reset edges opacity
          links
            .attr('stroke-opacity', 0.3)
            .attr('stroke-width', 1.5);

          // Reset nodes opacity
          nodeGroups
            .select('circle')
            .attr('opacity', 1);
        }
        // If selected, keep highlights (managed by selection useEffect)
      });

    // Update positions on simulation tick with throttling and culling
    const renderInterval = isLargeDataset ? 1000 / 30 : 1000 / 60; // 30fps for large graphs, 60fps for small
    simulation.on('tick', () => {
      const now = performance.now();
      if (now - lastRenderRef.current < renderInterval) return; // Throttle
      lastRenderRef.current = now;

      // Viewport culling for large datasets
      if (isLargeDataset) {
        const padding = 100;
        const visibleNodes = new Set<string>();
        d3Nodes.forEach(node => {
          if ((node.x || 0) > -padding && (node.x || 0) < width + padding &&
              (node.y || 0) > -padding && (node.y || 0) < height + padding) {
            visibleNodes.add(node.id);
          }
        });
        visibleNodesRef.current = visibleNodes;
      }

      // Update edge positions (only visible edges)
      links.attr('x1', (d) => (d.source as D3Node).x || 0).attr('y1', (d) => (d.source as D3Node).y || 0).attr('x2', (d) => (d.target as D3Node).x || 0).attr('y2', (d) => (d.target as D3Node).y || 0);

      // Update edge label positions (centered on edge midpoint)
      edgeLabels
        .attr('x', (d) => {
          const source = d.source as D3Node;
          const target = d.target as D3Node;
          return ((source.x || 0) + (target.x || 0)) / 2;
        })
        .attr('y', (d) => {
          const source = d.source as D3Node;
          const target = d.target as D3Node;
          return ((source.y || 0) + (target.y || 0)) / 2;
        });

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
  }, [nodes, edges, dimensions, onNodeClick, onNodeHover]);

  // Update visual selection when node is clicked (without restarting simulation)
  useEffect(() => {
    if (!nodeGroupsRef.current || !linksRef.current || !d3NodesRef.current || !d3EdgesRef.current) return;

    const nodeGroups = nodeGroupsRef.current;
    const links = linksRef.current;
    const d3Nodes = d3NodesRef.current;
    const d3Edges = d3EdgesRef.current;

    if (selectedNodeId) {
      // Show label for selected node
      nodeGroups.each(function(d) {
        if (d.id === selectedNodeId) {
          d3.select(this)
            .select('text')
            .attr('opacity', 1);
        }
      });

      // Highlight connected edges
      links
        .attr('stroke-opacity', (edge) => {
          const source = edge.source as D3Node;
          const target = edge.target as D3Node;
          if (source.id === selectedNodeId || target.id === selectedNodeId) {
            return 0.8;
          }
          return 0.1;
        })
        .attr('stroke-width', (edge) => {
          const source = edge.source as D3Node;
          const target = edge.target as D3Node;
          if (source.id === selectedNodeId || target.id === selectedNodeId) {
            return 2.5;
          }
          return 0.5;
        });

      // Fade out other nodes, keep connected ones visible
      nodeGroups
        .select('circle')
        .attr('opacity', (otherNode) => {
          if (otherNode.id === selectedNodeId) return 1;
          const isConnected = d3Edges.some((edge) => {
            const source = edge.source as D3Node;
            const target = edge.target as D3Node;
            return (source.id === selectedNodeId && target.id === otherNode.id) ||
                   (target.id === selectedNodeId && source.id === otherNode.id);
          });
          return isConnected ? 1 : 0.2;
        });
    } else {
      // Reset to default state when no node is selected
      nodeGroups
        .selectAll('text')
        .attr('opacity', 0);
      
      links
        .attr('stroke-opacity', 0.3)
        .attr('stroke-width', 1.5);

      nodeGroups
        .selectAll('circle')
        .attr('opacity', 1);
    }
  }, [selectedNodeId]);

  return (
    <div className={styles.container}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className={styles.svg}
      />
      <div className={styles.info}>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendDotBlue}`} />
            <span>System (45)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendDotViolet}`} />
            <span>Projects-Dev (17)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendDotRed}`} />
            <span>Agent-Dev (5)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendDotYellow}`} />
            <span>OpenClaw (2)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
