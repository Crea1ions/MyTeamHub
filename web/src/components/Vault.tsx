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

/**
 * Build knowledge graph from real vault files
 * - Nodes: Each .md file in the vault
 * - Edges: Links found in file content ([[link]] format)
 */
const buildVaultGraph = (files: VaultFile[], fileContents: Map<string, string>): KnowledgeGraph => {
  // Create nodes from all .md files
  const mdFiles = files.filter(f => f.type === 'file' && f.path.endsWith('.md'));
  
  const nodes: GraphNode[] = mdFiles.map((file, index) => ({
    id: file.path,
    label: file.title || file.path.split('/').pop() || 'Untitled',
    type: 'note',
    position: {
      x: 100 + (index % 8) * 150,
      y: 100 + Math.floor(index / 8) * 150,
    },
    path: file.path,  // Include path for category-based coloring
  }));

  // Create edges from wikilinks found in file content
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  mdFiles.forEach((file) => {
    const content = fileContents.get(file.path) || '';
    
    // Extract all [[...]] wikilinks
    const wikiLinkRegex = /\[\[([^\[\]]+)\]\]/g;
    let match;
    
    while ((match = wikiLinkRegex.exec(content)) !== null) {
      let linkTarget = match[1].trim();
      
      // Normalize link target:
      // - Remove anchor (#section)
      // - Add .md extension if missing
      // - Normalize path
      if (linkTarget.includes('#')) {
        linkTarget = linkTarget.split('#')[0].trim();
      }
      
      if (!linkTarget.endsWith('.md')) {
        linkTarget = linkTarget + '.md';
      }
      
      // Check if target file exists in vault
      const targetExists = mdFiles.some(f => f.path === linkTarget || f.path.endsWith('/' + linkTarget));
      
      if (targetExists) {
        const edgeKey = `${file.path}->${linkTarget}`;
        if (!edgeSet.has(edgeKey)) {
          edges.push({
            id: edgeKey,
            source: file.path,
            target: linkTarget,
            type: 'references',
          });
          edgeSet.add(edgeKey);
        }
      }
    }
  });

  console.log(`📊 Built graph with ${nodes.length} nodes and ${edges.length} edges`);
  return { nodes, edges };
};

export const Vault: React.FC<VaultProps> = () => {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [selectedNote, setSelectedNote] = useState<VaultNote | undefined>(undefined);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [vaultFolders, setVaultFolders] = useState<Record<string, VaultNote[]>>({});
  const [loadedNotes, setLoadedNotes] = useState<VaultNote[]>([]);
  const [graph, setGraph] = useState<KnowledgeGraph>({ nodes: [], edges: [] });

  // Load all vault files on component mount to populate graph
  useEffect(() => {
    const loadVaultGraph = async () => {
      try {
        console.log('🔄 Loading vault files for graph...');
        // Use recursive listing to find all .md files including nested directories
        const files = await orchestratorClient.listVaultFilesRecursive('.');
        console.log('📁 Vault files loaded:', files.length, 'items');
        
        // Filter to .md files only
        const mdFiles = files.filter(f => f.type === 'file' && f.path.endsWith('.md'));
        console.log(`📄 Found ${mdFiles.length} markdown files`);
        
        // Load content for each file to extract wikilinks
        // Use a queue to limit concurrent requests (max 4 at a time)
        const fileContents = new Map<string, string>();
        const queue = [...mdFiles];
        const maxConcurrent = 4;
        const inProgress = new Set<Promise<void>>();
        
        while (queue.length > 0 || inProgress.size > 0) {
          // Start new requests up to max concurrent
          while (inProgress.size < maxConcurrent && queue.length > 0) {
            const file = queue.shift()!;
            const promise = (async () => {
              try {
                const content = await orchestratorClient.readVaultFileRaw(file.path);
                fileContents.set(file.path, content.content || '');
              } catch (error) {
                console.warn(`⚠️ Could not load content for ${file.path}:`, error);
                fileContents.set(file.path, '');
              } finally {
                inProgress.delete(promise);
              }
            })();
            inProgress.add(promise);
          }
          
          // Wait for at least one to finish
          if (inProgress.size > 0) {
            await Promise.race(inProgress);
          }
        }
        
        // Build graph from real files and links
        if (mdFiles.length > 0) {
          const graph = buildVaultGraph(mdFiles, fileContents);
          setGraph(graph);
          console.log(`✅ Graph ready: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
        } else {
          console.warn('⚠️ No markdown files found in vault');
        }
      } catch (error) {
        console.error('❌ Error loading vault graph:', error);
      }
    };

    loadVaultGraph();
  }, []);

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

  const handleContentSave = async (path: string, content: string) => {
    try {
      console.log('💾 Saving file:', path);
      await orchestratorClient.writeVaultFile(path, content);
      
      // Update local note with new content
      setSelectedNote((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content,
          updatedAt: new Date(),
        };
      });
      
      // Update in loaded notes
      setLoadedNotes((prev) => {
        return prev.map((note) => {
          if (note.path === path) {
            return {
              ...note,
              content,
              updatedAt: new Date(),
            };
          }
          return note;
        });
      });
      
      console.log('✅ File saved successfully');
    } catch (error) {
      console.error('❌ Error saving file:', error);
      throw error;
    }
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
          onContentSave={handleContentSave}
        />
      }
    />
  );
};

export default Vault;
