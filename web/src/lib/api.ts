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

/**
 * Retry helper with exponential backoff
 * Retries a function up to maxRetries times with exponential delay
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param initialDelay - Initial delay in ms (default: 1000)
 * @param onRetry - Optional callback to report retry attempts
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  onRetry?: (attempt: number, delay: number, error: Error) => void
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Calculate exponential backoff: initialDelay * 2^attempt
      const delay = initialDelay * Math.pow(2, attempt);
      
      // Call optional retry callback
      if (onRetry) {
        onRetry(attempt + 1, delay, lastError);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Unknown error in retryWithBackoff');
}

class OrchestratorClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ORCHESTRATOR_API_BASE,
      timeout: 120000, // Increased from 30s to 120s (2 minutes) to allow for complex LLM queries
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
    return retryWithBackoff(
      async () => {
        const response = await this.client.get('/orchestrator/agents');
        // API returns { agents: [...], total: N }
        return response.data.agents || [];
      },
      3, // maxRetries
      1000, // initialDelay
      (attempt, delay, error) => {
        console.warn(`🔄 Retrying listAgents (attempt ${attempt}/3) after ${delay}ms. Error: ${error.message}`);
      }
    );
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
  // Now accepts optional agent prompt parameter for custom agent instructions
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
    abortSignal?: AbortSignal,
    agentPrompt?: string,  // Custom agent prompt - will override default
    shareEditorContext?: boolean,
    sessionId?: string,
  ): Promise<{ response: string; agent: string; model: string }> {
    try {
      // Get API key from localStorage (configured in Settings)
      const configJson = localStorage.getItem('myteamhub-api-config');
      let apiKey = '';
      
      if (configJson) {
        try {
          const config = JSON.parse(configJson);
          apiKey = config.mistralApiKey || ''; // Note: saved as 'mistralApiKey' in APIConfig.tsx
        } catch (e) {
          console.warn('Failed to parse API config from localStorage', e);
        }
      }

      if (!apiKey && (agentId || 'collaborator') !== 'arke') {
        throw new Error('Mistral API key not configured. Please set it in Settings.');
      }

      const payload: any = {
        message,
        apiKey, // Send API key directly to proxy
        agent: agentId || 'collaborator',
        temperature: temperature || 0.7,
      };

      if (sessionId) {
        payload.session_id = sessionId;
      }

      payload.share_editor_context = Boolean(shareEditorContext);

      // Add custom agent prompt if provided
      if (agentPrompt) {
        payload.prompt = agentPrompt;
      }

      // Add editor context if provided
      if (editorContext) {
        payload.context = editorContext;
      }

      const config: any = {};
      if (abortSignal) {
        config.signal = abortSignal;
      }

      // Use proxy LLM instead of orchestrator
      // Proxy is at http://localhost:3001, frontend is at :3000
      const proxyClient = axios.create({
        baseURL: 'http://localhost:3001',
        timeout: 120000,
      });

      // Retry with exponential backoff, but respect abortSignal
      return await retryWithBackoff(
        async () => {
          // Check if already aborted before retrying
          if (abortSignal?.aborted) {
            throw new Error('Request was cancelled');
          }
          const response = await proxyClient.post('/api/chat', payload, config);
          return response.data;
        },
        3, // maxRetries
        1000, // initialDelay
        (attempt, delay, error) => {
          if (!abortSignal?.aborted) {
            console.warn(`🔄 Retrying chat (attempt ${attempt}/3) after ${delay}ms. Error: ${error.message}`);
          }
        }
      );
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
      const paths: string[] = response.data.files || [];
      
      // Convert string paths to VaultFile objects
      return paths.map(path => ({
        id: path,
        path: path,
        type: path.endsWith('.md') ? 'file' : 'folder',
        title: path.split('/').pop() || path,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to list vault files:', error);
      throw error;
    }
  }

  /**
   * Recursively list all files in vault, including nested directories
   * Used for building complete knowledge graph with all .md files
   * Uses sequential requests to avoid overwhelming the server
   */
  async listVaultFilesRecursive(directory: string = '.'): Promise<VaultFile[]> {
    try {
      const allFiles: VaultFile[] = [];
      const visited = new Set<string>();
      const queue: string[] = [directory];
      
      // Process directories sequentially to avoid overwhelming the server
      while (queue.length > 0) {
        const dir = queue.shift()!;
        if (visited.has(dir)) continue;
        visited.add(dir);
        
        try {
          const response = await this.client.get('/vault/files', { params: { directory: dir } });
          const paths: string[] = response.data.files || [];
          
          for (const path of paths) {
            const fullPath = dir === '.' ? path : `${dir}/${path}`;
            
            if (path.endsWith('.md')) {
              // It's a markdown file
              allFiles.push({
                id: fullPath,
                path: fullPath,
                type: 'file',
                title: path.split('/').pop() || path,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
              });
            } else if (!path.includes('.')) {
              // Likely a folder (no extension), add to queue for exploration
              queue.push(fullPath);
            }
          }
        } catch (error) {
          console.warn(`Could not explore directory ${dir}:`, error);
        }
      }
      
      console.log(`📂 Found ${allFiles.length} .md files recursively`);
      return allFiles;
    } catch (error) {
      console.error('Failed to recursively list vault files:', error);
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

  /**
   * Load vault structure from a specific directory (for Studio, etc)
   * Returns only files/folders within that directory
   * @param directory - Vault directory path (e.g., '00-Inbox/myteam-studio')
   */
  async loadVaultStructureFromDirectory(directory: string): Promise<{ files: string[]; metadata?: Record<string, any> }> {
    try {
      // Use recursive listing for the specific directory
      const vaultFiles = await this.listVaultFilesRecursive(directory);
      
      // Extract just the relative paths (without the directory prefix)
      const paths = vaultFiles.map(f => {
        const relative = f.path.startsWith(directory + '/') 
          ? f.path.substring(directory.length + 1)
          : f.path;
        return relative;
      });
      
      console.log(`📁 Loaded ${paths.length} items from ${directory}`);
      
      // Build metadata
      const metadata: Record<string, any> = {};
      vaultFiles.forEach(file => {
        const relative = file.path.startsWith(directory + '/') 
          ? file.path.substring(directory.length + 1)
          : file.path;
        metadata[relative] = {
          agent: undefined,
          created_at: file.created,
          links: [],
        };
      });

      return { files: paths, metadata };
    } catch (error) {
      console.error(`Failed to load vault structure from directory ${directory}:`, error);
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
export const loadVaultStructureFromDirectory = (directory: string) => orchestratorClient.loadVaultStructureFromDirectory(directory);
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
