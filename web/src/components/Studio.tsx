import React, { useState, useEffect, useCallback } from 'react';
import { SplitPaneLayout } from './SplitPaneLayout';
import { ProjectExplorer } from './ProjectExplorer';
import { MarkdownEditor } from './MarkdownEditor';
import { AgentChat } from './AgentChat';
import { VaultFilePickerModal } from './VaultFilePickerModal';
import { orchestratorClient } from '../lib/api';
import { useWorkflowPolling } from '../lib/hooks/useWorkflowPolling';
import type { ProjectFile, Agent, ChatMessage } from '../types/index';

interface StudioProps {}

export const Studio: React.FC<StudioProps> = () => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [editorContent, setEditorContent] = useState<string>(''); // Editor context for agents
  const [abortController, setAbortController] = useState<AbortController | null>(null); // For cancellation
  const [vaultPickerOpen, setVaultPickerOpen] = useState<boolean>(false); // Phase 5.4: Vault modal
  const [isLoadingVault, setIsLoadingVault] = useState<boolean>(false); // Phase 5.4: Loading state
  
  // Workflow polling state
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

  // Memoize the workflow completion handler to prevent infinite loops
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

  // Load real agents from orchestrator
  useEffect(() => {
    const loadAgents = async () => {
      try {
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

  // Initialize with sample data for files
  useEffect(() => {
    const appData = (window as any).__APP_DATA__;
    if (appData) {
      const flattenFiles = (file: ProjectFile) => {
        const result: ProjectFile[] = [file];
        if (file.children) {
          result.push(...file.children.flatMap(flattenFiles));
        }
        return result;
      };

      const allFiles = flattenFiles(appData.sampleProject);
      setFiles([appData.sampleProject]);

      // Set first file as default
      const firstFile = allFiles.find((f) => f.type === 'file');
      if (firstFile) {
        setSelectedFileId(firstFile.id);
      }
    }
  }, []);

  const selectedFile = files
    .flatMap((f) => {
      const collect: ProjectFile[] = [f];
      const queue = [...(f.children || [])];
      while (queue.length > 0) {
        const current = queue.shift()!;
        collect.push(current);
        if (current.children) {
          queue.push(...current.children);
        }
      }
      return collect;
    })
    .find((f) => f.id === selectedFileId);

  const handleFileSelect = (file: ProjectFile) => {
    setSelectedFileId(file.id);
  };

  const handleFileChange = (content: string) => {
    // Update file content AND capture it for agent context
    setEditorContent(content);
    
    // Update file in state
    const updateFileContent = (file: ProjectFile, fileId: string, newContent: string): ProjectFile => {
      if (file.id === fileId) {
        return { ...file, content: newContent, updatedAt: new Date() };
      }
      if (file.children) {
        return {
          ...file,
          children: file.children.map((f) => updateFileContent(f, fileId, newContent)),
        };
      }
      return file;
    };

    setFiles(files.map((f) => updateFileContent(f, selectedFileId, content)));
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedFile) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      agentId: selectedAgentId,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Create a new AbortController for this request
      const controller = new AbortController();
      setAbortController(controller);

      // Pass editor context to agent
      const editorContext = {
        editor_content: editorContent || selectedFile.content || '',
        file_name: selectedFile.name || 'Untitled',
        project_id: 'myteamhub',
        line_count: (editorContent || selectedFile.content || '').split('\n').length,
      };

      // Use direct chat endpoint (fast path, no workflow polling)
      const response = await orchestratorClient.directChat(
        message, 
        selectedAgentId, 
        undefined, // temperature
        editorContext, // pass editor context
        controller.signal // pass abort signal for cancellation
      );

      const assistantMessage: ChatMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        agentId: selectedAgentId,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setAbortController(null); // Clear after successful response
    } catch (error) {
      // Don't show error message if request was aborted
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
      setAbortController(null); // Clear after error
    }
  };

  const handleStopMessage = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  const handleSaveToVault = async (content: string) => {
    if (!selectedFile || !selectedAgentId) {
      alert('Please select a file and agent before saving to vault');
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0] + '_' + 
        String(new Date().getHours()).padStart(2, '0') + '-' +
        String(new Date().getMinutes()).padStart(2, '0') + '-' +
        String(new Date().getSeconds()).padStart(2, '0');
      
      const vaultPath = 'projects/myteamhub/outputs/' + timestamp + '-' + selectedAgentId + '.md';
      
      const metadata = {
        source: 'studio',
        agent: selectedAgentId,
        created_at: new Date().toISOString(),
        project_id: 'myteamhub',
        links: [],
      };

      await orchestratorClient.writeVaultFileWithMetadata(vaultPath, content, metadata);
      alert('File saved to Vault!');
    } catch (error) {
      alert('Failed to save to Vault: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Phase 5.4: Load file from Vault
  const handleLoadVaultFile = async (filePath: string) => {
    setIsLoadingVault(true);
    try {
      // Read the vault file
      const vaultFile = await orchestratorClient.readVaultFile(filePath);
      
      // Create a new file object from vault content
      const newFile: ProjectFile = {
        id: 'vault-' + Date.now(),
        name: vaultFile.path.split('/').pop() || 'Untitled',
        type: 'file',
        content: vaultFile.content || '',
        children: [],
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      // Add to files and select it
      setFiles([newFile, ...files]);
      setSelectedFileId(newFile.id);
      setEditorContent(vaultFile.content || '');
      setVaultPickerOpen(false);
    } catch (error) {
      alert('Failed to load vault file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoadingVault(false);
    }
  };

  return (
    <>
      {/* Phase 5.4: Vault File Picker Modal */}
      <VaultFilePickerModal
        isOpen={vaultPickerOpen}
        onClose={() => setVaultPickerOpen(false)}
        onFileSelected={handleLoadVaultFile}
        isLoading={isLoadingVault}
      />

      <SplitPaneLayout
        left={
          <ProjectExplorer
            files={files}
            selectedFileId={selectedFileId}
            onFileSelect={handleFileSelect}
            onLoadFromVault={() => setVaultPickerOpen(true)}
          />
        }
        center={
          selectedFile && selectedFile.type === 'file' ? (
            <MarkdownEditor
              fileName={selectedFile.name}
              content={selectedFile.content || ''}
              onChange={handleFileChange}
              onSave={() => {
                console.log('File saved:', selectedFile.name);
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#8b98a5',
              }}
            >
              Select a file to edit
            </div>
          )
        }
        right={
          <AgentChat
            agents={agents}
            selectedAgentId={selectedAgentId}
            onAgentSelect={setSelectedAgentId}
            messages={messages}
            onSendMessage={handleSendMessage}
            onSaveToVault={handleSaveToVault}
            onStop={handleStopMessage}
            isLoading={workflowState.isLoading || !!abortController}
            workflowError={workflowState.error}
            editorContext={selectedFile?.name}
          />
        }
      />
    </>
  );
};

export default Studio;
