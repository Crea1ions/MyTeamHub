import React, { useState, useEffect, useCallback } from 'react';
import { SplitPaneLayout } from './SplitPaneLayout';
import { VaultExplorer } from './VaultExplorer';
import { ContentViewer } from './ContentViewer';
import { AgentChat } from './AgentChat';
import { orchestratorClient } from '../lib/api';
import { useWorkflowPolling } from '../lib/hooks/useWorkflowPolling';
import { parseFrontmatter } from '../lib/frontmatter-parser';
import type { Agent, ChatMessage, VaultNote } from '../types/index';
import styles from './Studio.module.css';

interface StudioProps {}

/**
 * Studio: Cognitive IDE with editor + agent chat
 * Uses VaultExplorer (same as Vault page) to navigate 00-Inbox/myteam-studio folder
 * Displays editor on center, chat on right with full style consistency with Vault
 */
export const Studio: React.FC<StudioProps> = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [editorContent, setEditorContent] = useState<string>('');
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [selectedNote, setSelectedNote] = useState<VaultNote | undefined>(undefined);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

  // Load real agents from localStorage first, then orchestrator
  useEffect(() => {
    const loadAgents = async () => {
      try {
        // Try to load from localStorage first (user-configured agents)
        const savedAgents = localStorage.getItem('myteamhub-agents');
        if (savedAgents) {
          try {
            const parsedAgents = JSON.parse(savedAgents);
            setAgents(parsedAgents);
            if (parsedAgents.length > 0) {
              setSelectedAgentId(parsedAgents[0].id);
            }
            return;
          } catch (e) {
            console.warn('Failed to parse saved agents from localStorage:', e);
          }
        }
        
        // Fallback to orchestrator
        const loadedAgents = await orchestratorClient.listAgents();
        setAgents(loadedAgents);
        if (loadedAgents.length > 0) {
          setSelectedAgentId(loadedAgents[0].id);
        }
      } catch (error) {
        console.error('Failed to load agents:', error);
        // Fallback to sample data if available
        const appData = (window as any).__APP_DATA__;
        if (appData?.sampleAgents) {
          setAgents(appData.sampleAgents);
          if (appData.sampleAgents.length > 0) {
            setSelectedAgentId(appData.sampleAgents[0].id);
          }
        }
      }
    };

    loadAgents();
  }, []);

  // Load file content when path is selected
  useEffect(() => {
    if (!selectedPath) {
      setSelectedNote(undefined);
      setEditorContent('');
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
          setEditorContent(note.content);
        } catch (apiError) {
          // If API fails, try raw file endpoint
          console.warn('API parse failed, trying raw file endpoint:', apiError);
          
          try {
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
            setEditorContent(note.content);
          } catch (rawError) {
            console.warn('Could not parse file content:', rawError);
            const filename = selectedPath.split('/').pop() || 'Untitled';
            const note: VaultNote = {
              id: selectedPath,
              title: filename,
              content: `# ${filename}\n\n**File path**: \`${selectedPath}\``,
              path: selectedPath,
              tags: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              backlinks: [],
              type: 'note',
            };
            
            setSelectedNote(note);
            setEditorContent(note.content);
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

  // Workflow completion handler
  const handleWorkflowComplete = useCallback(
    (result: any) => {
      if (result) {
        const assistantMessage: ChatMessage = {
          id: Math.random().toString(),
          role: 'assistant',
          content: result.output || JSON.stringify(result),
          timestamp: new Date(),
          agentId: selectedAgentId,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setActiveWorkflowId(null);
      }
    },
    [selectedAgentId]
  );

  const workflowState = useWorkflowPolling(activeWorkflowId, handleWorkflowComplete);

  // Handle file change and save
  const handleFileChange = (content: string) => {
    setEditorContent(content);
  };

  const handleFileSave = async (path: string, content: string) => {
    try {
      console.log('💾 Saving file:', path);
      await orchestratorClient.writeVaultFile(path, content);
      
      // Update note state
      setSelectedNote((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: content,
          updatedAt: new Date(),
        };
      });
      
      // Update editor content
      setEditorContent(content);
      console.log('✅ File saved successfully:', path);
    } catch (error) {
      console.error('❌ Error saving file:', error);
      throw error;
    }
  };

  const handleFileSaveOld = async () => {
    if (!selectedNote) return;

    try {
      // Save to vault
      const newContent = editorContent;
      await orchestratorClient.writeVaultFile(selectedPath, newContent);
      
      // Update note state
      setSelectedNote((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: newContent,
          updatedAt: new Date(),
        };
      });
      
      console.log('✅ File saved successfully:', selectedPath);
    } catch (error) {
      console.error('❌ Error saving file:', error);
      throw error;
    }
  };

  // Handle chat send
  const handleSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Create editor context for agent using note content
    const editorContext = selectedNote ? {
      editor_content: selectedNote.content,
      file_name: selectedNote.title,
      project_id: '00-Inbox/myteam-studio',
      line_count: selectedNote.content.split('\n').length,
    } : undefined;

    try {
      const controller = new AbortController();
      setAbortController(controller);

      // Find selected agent to get its custom prompt and temperature
      const selectedAgent = agents.find(a => a.id === selectedAgentId);
      const agentPrompt = selectedAgent && 'prompt' in selectedAgent ? (selectedAgent as any).prompt : undefined;
      const agentTemperature = selectedAgent && 'temperature' in selectedAgent ? (selectedAgent as any).temperature : undefined;

      const response = await orchestratorClient.directChat(
        message,
        selectedAgentId,
        agentTemperature,  // Pass agent's configured temperature
        editorContext,
        controller.signal,
        agentPrompt  // Pass custom agent prompt if available
      );

      const assistantMessage: ChatMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        agentId: selectedAgentId,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setAbortController(null);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const canceledMessage: ChatMessage = {
          id: Math.random().toString(),
          role: 'assistant',
          content: 'Request cancelled.',
          timestamp: new Date(),
          agentId: selectedAgentId,
        };
        setMessages((prev) => [...prev, canceledMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: Math.random().toString(),
          role: 'assistant',
          content: 'Error: ' + (error instanceof Error ? error.message : 'Failed to process message'),
          timestamp: new Date(),
          agentId: selectedAgentId,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
      setAbortController(null);
    }
  };

  const handleStopMessage = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  return (
    <SplitPaneLayout
      left={
        // Use VaultExplorer pointing to myteam-studio - same component as Vault page!
        <VaultExplorer
          selectedPath={selectedPath}
          onFileSelect={setSelectedPath}
          onFileOpen={setSelectedPath}
          initialVaultPath="00-Inbox/myteam-studio"
        />
      }
      center={
        // Use ContentViewer - same as Vault page!
        <ContentViewer
          note={selectedNote}
          isLoading={isLoadingContent}
          onLinkClick={(link) => {
            // Handle wikilink clicks - navigate to that file
            const target = link.target.endsWith('.md') ? link.target : link.target + '.md';
            const fullPath = `00-Inbox/myteam-studio/${target}`;
            setSelectedPath(fullPath);
          }}
          onContentSave={handleFileSave}
        />
      }
      right={
        <AgentChat
          agents={agents}
          selectedAgentId={selectedAgentId}
          onAgentSelect={setSelectedAgentId}
          messages={messages}
          onSendMessage={handleSendMessage}
          onStop={handleStopMessage}
          isLoading={abortController !== null}
        />
      }
    />
  );
};

export default Studio;
