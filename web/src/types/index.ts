// File system types
export interface ProjectFile {
  id: string;
  path: string;
  name: string;
  content: string;
  type: 'file' | 'folder';
  children?: ProjectFile[];
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  files: ProjectFile[];
}

// Chat/Agent types
export interface Agent {
  id: string;
  name: string;
  description: string;
  prompt: string;
  enabled: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
}

export interface Session {
  id: string;
  fileId: string;
  agentId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Vault types
export interface VaultNote {
  id: string;
  path: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  backlinks: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'note' | 'session' | 'output' | 'agent';
  position?: { x: number; y: number };
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'references' | 'output-from' | 'session-to';
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Config types
export interface SystemConfig {
  mistralApiKey: string;
  openaiApiKey: string;
  vaultPath: string;
  agents: Agent[];
  logging: boolean;
  tracing: boolean;
  audit: boolean;
}

export interface OrchestratorStatus {
  isOnline: boolean;
  activeAgents: number;
  vaultSyncStatus: 'OK' | 'SYNCING' | 'ERROR';
  llmConnected: boolean;
}

// ===== SCREEN 2: VAULT TYPES =====

export interface VaultFolder {
  type: 'notes' | 'sessions' | 'agents' | 'outputs' | 'logs';
  items: VaultNote[];
}

export interface VaultNote {
  id: string;
  title: string;
  content: string;
  path: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  backlinks: string[];
  type: 'note' | 'session' | 'agent-output' | 'log';
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'note' | 'session' | 'output' | 'agent';
  position: { x: number; y: number };
  color?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'references' | 'output-from' | 'session-to' | 'backlink';
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ===== SCREEN 3: SYSTEM CONFIG TYPES =====

export interface APIConfig {
  mistralApiKey: string;
  openaiApiKey: string;
  vaultPath: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  prompt: string;
  enabled: boolean;
}

export interface VaultObservability {
  logging: boolean;
  tracing: boolean;
  audit: boolean;
}

export interface OpenClawStatus {
  mode: 'READ_ONLY' | 'DISABLED';
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  endpoint?: string;
}

export interface SystemStatus {
  orchestrator: 'ONLINE' | 'OFFLINE' | 'ERROR';
  llm: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  vault: 'SYNC_OK' | 'SYNCING' | 'ERROR';
  agentsActive: number;
}
