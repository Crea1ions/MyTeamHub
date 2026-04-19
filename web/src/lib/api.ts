import axios, { AxiosInstance } from 'axios';

const ORCHESTRATOR_API_BASE = 'http://localhost:8001';

export interface OrchestratorStatus {
  health: 'healthy' | 'unhealthy';
  timestamp: string;
  active_workflows: number;
}

export interface Workflow {
  workflow_id: string;
  state: string;
  event_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  task?: string;
}

export interface WorkflowResult {
  workflow_id: string;
  success: boolean;
  result: Record<string, any>;
  metadata: {
    duration_ms: number;
    status: string;
    error_message?: string;
  };
  logs?: string[];
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  capabilities?: string[];
}

export interface WorkflowMetrics {
  workflow_id: string;
  state: 'pending' | 'running' | 'complete' | 'error';
  duration_ms: number;
  status: string;
  error_message?: string;
  result?: Record<string, any>;
}

export interface VaultFile {
  id: string;
  path: string;
  type: 'file' | 'folder';
  title: string;
  content?: string;
  created: string;
  updated: string;
}

export interface SearchResult {
  query: string;
  results: VaultFile[];
}

export interface OrchestratorStatusResponse {
  status: string;
  active_workflows: number;
  total_processed: number;
  agents_available: string[];
  system_uptime_ms: number;
  last_event: string;
  version: string;
}

class OrchestratorClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ORCHESTRATOR_API_BASE,
      timeout: 30000,
    });

    // Add error interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to Orchestrator. Make sure it\'s running on port 8001');
        }
        throw error;
      }
    );
  }

  async getStatus(): Promise<OrchestratorStatus> {
    try {
      const response = await this.client.get('/orchestrator/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get orchestrator status:', error);
      throw error;
    }
  }

  async listWorkflows(): Promise<Workflow[]> {
    try {
      const response = await this.client.get('/orchestrator/workflows');
      return response.data;
    } catch (error) {
      console.error('Failed to list workflows:', error);
      throw error;
    }
  }

  async getWorkflow(workflowId: string): Promise<Workflow> {
    try {
      const response = await this.client.get(`/orchestrator/workflows/${workflowId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get workflow ${workflowId}:`, error);
      throw error;
    }
  }

  async getWorkflowResult(workflowId: string): Promise<WorkflowResult> {
    try {
      const response = await this.client.get(`/orchestrator/workflows/${workflowId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get workflow result ${workflowId}:`, error);
      throw error;
    }
  }

  async listAgents(): Promise<Agent[]> {
    try {
      const response = await this.client.get('/orchestrator/agents');
      // API returns { agents: [...], total: N }
      return response.data.agents || [];
    } catch (error) {
      console.error('Failed to list agents:', error);
      throw error;
    }
  }

  async submitEvent(eventData: {
    task: string;
    context?: string;
    agent_id?: string;
    event_data?: Record<string, any>;
  }): Promise<{ workflow_id: string }> {
    try {
      const event = {
        event_type: 'agent_task',
        timestamp: new Date().toISOString(),
        data: {
          task: eventData.task,
          agent_id: eventData.agent_id || 'echo',
          context: eventData.context || '',
          ...eventData.event_data,
        },
      };
      const response = await this.client.post('/api/events', event);
      // API returns { success, file_id, message }
      // Map file_id to workflow_id for UI compatibility
      return { workflow_id: response.data.file_id || 'unknown' };
    } catch (error) {
      console.error('Failed to submit event:', error);
      throw error;
    }
  }

  async getWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics> {
    try {
      const response = await this.client.get(`/orchestrator/workflows/${workflowId}/metrics`);
      return response.data;
    } catch (error) {
      // Don't log here - let the caller (useWorkflowPolling) decide how to handle
      throw error;
    }
  }

  // LLM / Mistral proxy endpoint
  async chatWithMistral(messages: Array<{role: string; content: string}>, model?: string): Promise<any> {
    try {
      const response = await this.client.post('/orchestrator/llm/chat/completions', {
        model: model || 'mistral-small',
        messages,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to call Mistral proxy:', error);
      throw error;
    }
  }

  // Direct chat endpoint (fast path, no orchestrator workflow delay)
  // Returns response directly from LLM without workflow polling
  // Now includes editor context for agents to reason about user's work
  // Supports cancellation via AbortSignal
  async directChat(
    message: string,
    agentId?: string,
    temperature?: number,
    editorContext?: {
      editor_content: string;
      file_name: string;
      project_id: string;
      line_count: number;
    },
    abortSignal?: AbortSignal
  ): Promise<{ response: string; agent: string; model: string }> {
    try {
      const payload: any = {
        message,
        agent: agentId || 'collaborator',
        temperature: temperature || 0.7,
      };

      // Add editor context if provided
      if (editorContext) {
        payload.context = editorContext;
      }

      const config: any = {};
      if (abortSignal) {
        config.signal = abortSignal;
      }

      const response = await this.client.post('/api/chat', payload, config);
      return response.data;
    } catch (error) {
      console.error('Failed to call direct chat:', error);
      throw error;
    }
  }

  async archiveWorkflow(workflowId: string): Promise<void> {
    try {
      await this.client.post(`/orchestrator/workflows/${workflowId}/archive`);
    } catch (error) {
      console.error(`Failed to archive workflow ${workflowId}:`, error);
      throw error;
    }
  }

  // Vault methods (via orchestrator API only)
  async listVaultFiles(directory: string = '.'): Promise<VaultFile[]> {
    try {
      const response = await this.client.get('/vault/files', { params: { directory } });
      return response.data.files || [];
    } catch (error) {
      console.error('Failed to list vault files:', error);
      throw error;
    }
  }

  async readVaultFile(path: string): Promise<VaultFile> {
    try {
      const response = await this.client.get(`/vault/file/${encodeURIComponent(path)}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to read vault file ${path}:`, error);
      throw error;
    }
  }

  async readVaultFileRaw(path: string): Promise<{ path: string; content: string }> {
    try {
      const response = await this.client.get(`/vault/raw/${encodeURIComponent(path)}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to read raw vault file ${path}:`, error);
      throw error;
    }
  }

  async writeVaultFile(path: string, content: string): Promise<VaultFile> {
    try {
      const response = await this.client.put(`/vault/file/${encodeURIComponent(path)}`, {
        content,
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to write vault file ${path}:`, error);
      throw error;
    }
  }

  async writeVaultFileWithMetadata(
    path: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<VaultFile> {
    try {
      const response = await this.client.put(`/vault/file/${encodeURIComponent(path)}`, {
        content,
        metadata,
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to write vault file ${path}:`, error);
      throw error;
    }
  }

  async searchVault(query: string): Promise<SearchResult> {
    try {
      const response = await this.client.get('/vault/search', { params: { q: query } });
      return response.data;
    } catch (error) {
      console.error('Failed to search vault with query ' + query + ':', error);
      throw error;
    }
  }

  // Phase 5.4: New Vault Operations
  async loadVaultStructure(vaultPath: string = '/'): Promise<{ files: string[]; metadata?: Record<string, any> }> {
    try {
      // Use searchVault with .md pattern to get all markdown files recursively
      // Backend returns SearchResult with results as array of strings (file paths)
      const searchResult = await this.searchVault('.md');
      
      console.log('Search result:', searchResult);
      
      // searchResult.results is array of strings, not objects
      // Convert strings to proper format
      const paths = searchResult.results
        .filter((path: any): path is string => typeof path === 'string' && path.length > 0);
      
      console.log('Extracted paths:', paths);
      
      // Build minimal metadata (backend only returns paths)
      const metadata: Record<string, any> = {};
      paths.forEach(path => {
        metadata[path] = {
          agent: undefined,
          created_at: undefined,
          links: [],
        };
      });

      return { files: paths, metadata };
    } catch (error) {
      console.error(`Failed to load vault structure from ${vaultPath}:`, error);
      throw error;
    }
  }

  async getVaultTree(vaultPath: string): Promise<any> {
    try {
      return this.loadVaultStructure(vaultPath);
    } catch (error) {
      console.error(`Failed to get vault tree from ${vaultPath}:`, error);
      throw error;
    }
  }

  async extractLinksFromContent(content: string): Promise<{ links: string[] }> {
    try {
      // Client-side link extraction
      const linkRegex = /\[\[([^\]]+)\]\]|\[([^\]]+)\]\(([^)]+)\)/g;
      const links: string[] = [];
      let match;

      while ((match = linkRegex.exec(content)) !== null) {
        // Obsidian style [[...]]
        if (match[1]) {
          links.push(match[1]);
        }
        // Markdown style [text](path)
        if (match[3]) {
          links.push(match[3]);
        }
      }

      return { links };
    } catch (error) {
      console.error('Failed to extract links from content:', error);
      throw error;
    }
  }

  async parseVaultFileMetadata(content: string): Promise<{
    frontmatter: Record<string, any>;
    body: string;
  }> {
    try {
      // Simple YAML frontmatter parser
      const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
      const match = content.match(frontmatterRegex);

      if (!match) {
        return {
          frontmatter: {},
          body: content,
        };
      }

      const frontmatterStr = match[1];
      const body = match[2];
      const frontmatter: Record<string, any> = {};

      // Parse YAML-like format (simplified)
      frontmatterStr.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          const value = valueParts.join(':').trim();
          // Simple type detection
          if (value === 'true') {
            frontmatter[key.trim()] = true;
          } else if (value === 'false') {
            frontmatter[key.trim()] = false;
          } else if (value.startsWith('[') && value.endsWith(']')) {
            // Simple array parsing
            frontmatter[key.trim()] = value.slice(1, -1).split(',').map(v => v.trim());
          } else {
            frontmatter[key.trim()] = value;
          }
        }
      });

      return { frontmatter, body };
    } catch (error) {
      console.error('Failed to parse file metadata:', error);
      throw error;
    }
  }
}

export const orchestratorClient = new OrchestratorClient();

// Export methods as named functions for convenience
export const loadVaultStructure = (vaultPath: string) => orchestratorClient.loadVaultStructure(vaultPath);
export const getVaultTree = (vaultPath: string) => orchestratorClient.getVaultTree(vaultPath);
export const extractLinksFromContent = (content: string) => orchestratorClient.extractLinksFromContent(content);
export const parseVaultFileMetadata = (content: string) => orchestratorClient.parseVaultFileMetadata(content);
export const directChat = (
  message: string,
  agentId?: string,
  temperature?: number,
  editorContext?: any,
  abortSignal?: AbortSignal
) => orchestratorClient.directChat(message, agentId, temperature, editorContext, abortSignal);
export const writeVaultFileWithMetadata = (
  path: string,
  content: string,
  metadata?: Record<string, any>
) => orchestratorClient.writeVaultFileWithMetadata(path, content, metadata);
export const listVaultFiles = (path?: string) => orchestratorClient.listVaultFiles(path);
export const readVaultFile = (path: string) => orchestratorClient.readVaultFile(path);
