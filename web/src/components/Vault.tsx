import React, { useState, useEffect } from 'react';
import { SplitPaneLayout } from './SplitPaneLayout';
import { VaultExplorer } from './VaultExplorer';
import { GraphViewer } from './GraphViewer';
import { ContentViewer } from './ContentViewer';
import { orchestratorClient } from '../lib/api';
import { normalizeVaultPath, extractLinksFromText } from '../lib/link-parser';
import { parseFrontmatter } from '../lib/frontmatter-parser';
import type { ParsedLink } from '../lib/link-parser';
import type { VaultNote, KnowledgeGraph, GraphNode, GraphEdge } from '../types/index';

interface VaultProps {}

const generateSampleGraph = (notes: VaultNote[]): KnowledgeGraph => {
  // Create nodes from all notes loaded so far
  const nodes: GraphNode[] = notes.map((note, index) => ({
    id: note.id,
    label: note.title,
    type: note.type as any,
    position: {
      x: 100 + (index % 5) * 180,
      y: 100 + Math.floor(index / 5) * 150,
    },
  }));

  // Create edges from links found in note content
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();
  
  notes.forEach((note) => {
    const links = extractLinksFromText(note.content);
    links.forEach((link) => {
      if (link.isValid && link.target) {
        const edgeKey = `${note.id}->${link.target}`;
        if (!edgeSet.has(edgeKey)) {
          edges.push({
            id: edgeKey,
            source: note.id,
            target: link.target,
            type: 'references',
          });
          edgeSet.add(edgeKey);
        }
      }
    });
  });

  return { nodes, edges };
};

export const Vault: React.FC<VaultProps> = () => {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [selectedNote, setSelectedNote] = useState<VaultNote | undefined>(undefined);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [vaultFolders, setVaultFolders] = useState<Record<string, VaultNote[]>>({});
  const [loadedNotes, setLoadedNotes] = useState<VaultNote[]>([]);
  const [graph, setGraph] = useState<KnowledgeGraph>({ nodes: [], edges: [] });

  // Update graph whenever loaded notes change
  useEffect(() => {
    if (loadedNotes.length > 0) {
      const newGraph = generateSampleGraph(loadedNotes);
      setGraph(newGraph);
    }
  }, [loadedNotes]);

  // Load file content when path is selected
  useEffect(() => {
    if (!selectedPath) {
      setSelectedNote(undefined);
      return;
    }

    const loadFileContent = async () => {
      try {
        setIsLoadingContent(true);
        
        try {
          // Try to load via normal API (with frontmatter parsing)
          const fileResponse = await orchestratorClient.readVaultFile(selectedPath);
          
          const note: VaultNote = {
            id: fileResponse.id,
            title: fileResponse.title || selectedPath.split('/').pop() || 'Untitled',
            content: fileResponse.content || '',
            path: fileResponse.path,
            tags: fileResponse.tags || [],
            createdAt: new Date(fileResponse.created || Date.now()),
            updatedAt: new Date(fileResponse.updated || Date.now()),
            backlinks: [],
            type: 'note',
          };
          
          setSelectedNote(note);
          // Add to loaded notes for graph
          setLoadedNotes((prev) => {
            const exists = prev.find((n) => n.id === note.id);
            return exists ? prev : [...prev, note];
          });
        } catch (apiError) {
          // If API fails (likely due to complex frontmatter), try raw file endpoint
          console.warn('API parse failed, trying raw file endpoint:', apiError);
          
          try {
            // Load raw file content via new fallback endpoint
            const rawResponse = await orchestratorClient.readVaultFileRaw(selectedPath);
            const rawContent = rawResponse.content;
            const parsed = parseFrontmatter(rawContent);
            
            const filename = selectedPath.split('/').pop() || 'Untitled';
            const note: VaultNote = {
              id: selectedPath,
              title: parsed.frontmatter.title || filename,
              content: parsed.body || rawContent,
              path: selectedPath,
              tags: parsed.frontmatter.tags || [],
              createdAt: new Date(parsed.frontmatter.created || Date.now()),
              updatedAt: new Date(parsed.frontmatter.updated || Date.now()),
              backlinks: [],
              type: parsed.frontmatter.type || 'note',
            };
            
            setSelectedNote(note);
            // Add to loaded notes for graph
            setLoadedNotes((prev) => {
              const exists = prev.find((n) => n.id === note.id);
              return exists ? prev : [...prev, note];
            });
          } catch (rawError) {
            // Final fallback: create minimal note showing we found the file
            console.warn('Could not parse file content, using minimal fallback:', rawError);
            
            const filename = selectedPath.split('/').pop() || 'Untitled';
            const note: VaultNote = {
              id: selectedPath,
              title: filename,
              content: `# ${filename}\n\n**File path**: \`${selectedPath}\`\n\nThis file exists in the vault but could not be fully parsed. This typically happens with complex frontmatter YAML formatting. The file is still accessible and linked in the knowledge graph.`,
              path: selectedPath,
              tags: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              backlinks: [],
              type: 'note',
            };
            
            setSelectedNote(note);
            // Add to loaded notes for graph
            setLoadedNotes((prev) => {
              const exists = prev.find((n) => n.id === note.id);
              return exists ? prev : [...prev, note];
            });
          }
        }
      } catch (error) {
        console.error('Error loading file content:', error);
        setSelectedNote(undefined);
      } finally {
        setIsLoadingContent(false);
      }
    };

    loadFileContent();
  }, [selectedPath]);

  const handleLinkClick = (link: ParsedLink) => {
    // Normalize the target path and select it
    const normalizedPath = normalizeVaultPath(link.target);
    const pathWithExtension = normalizedPath.endsWith('.md')
      ? normalizedPath
      : `${normalizedPath}.md`;
    
    console.log('Navigating to link:', pathWithExtension);
    setSelectedPath(pathWithExtension);
  };

  return (
    <SplitPaneLayout
      left={
        <VaultExplorer
          selectedPath={selectedPath}
          onFileSelect={setSelectedPath}
          onFileOpen={setSelectedPath}
        />
      }
      center={
        <GraphViewer 
          nodes={graph.nodes} 
          edges={graph.edges} 
          selectedNodeId={selectedPath} 
          onNodeClick={setSelectedPath}
        />
      }
      right={
        <ContentViewer
          note={selectedNote}
          isLoading={isLoadingContent}
          onLinkClick={handleLinkClick}
        />
      }
    />
  );
};

export default Vault;
