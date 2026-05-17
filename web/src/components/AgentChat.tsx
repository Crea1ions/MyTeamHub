import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Zap, Download } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { ChatMessage as ChatMessageType, Agent } from '../types/index';
import styles from './AgentChat.module.css';

export interface AgentChatProps {
  agents: Agent[];
  selectedAgentId?: string;
  onAgentSelect: (agentId: string) => void;
  messages: ChatMessageType[];
  onSendMessage: (message: string) => void;
  onSaveToVault?: (content: string) => void;
  onStop?: () => void;
  isSending?: boolean;
  workflowError?: Error | null;
  editorContext?: string;
  shareEditorContext?: boolean;
  onToggleShareEditorContext?: (enabled: boolean) => void;
  canShareEditorContext?: boolean;
}

export const AgentChat: React.FC<AgentChatProps> = ({
  agents,
  selectedAgentId,
  onAgentSelect,
  messages,
  onSendMessage,
  onSaveToVault,
  onStop,
  isSending = false,
  workflowError,
  editorContext,
  shareEditorContext = false,
  onToggleShareEditorContext,
  canShareEditorContext = false,
}) => {
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSave = () => {
    // Concatenate all messages into a conversation string
    const conversationContent = messages
      .map((msg) => `**${msg.role === 'user' ? 'You' : 'Agent'}:**\n${msg.content}`)
      .join('\n\n');
    
    if (onSaveToVault && conversationContent.trim()) {
      onSaveToVault(conversationContent);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Agent Chat</h2>
        {messages.length > 0 && onSaveToVault && (
          <button
            onClick={handleSave}
            disabled={isSending || messages.length === 0}
            className={styles.saveButton}
            title="Save conversation to vault"
          >
            <Download size={16} />
            Save
          </button>
        )}
      </div>

      {/* Agent Selector */}
      <div className={styles.agentSelector}>
        <div className={styles.selectorLabel}>Agent</div>
        <select
          className={styles.select}
          value={selectedAgentId || ''}
          onChange={(e) => onAgentSelect(e.target.value)}
          disabled={isSending}
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
        {selectedAgent && (
          <p className={styles.agentDescription}>{selectedAgent.description}</p>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <input
            type="checkbox"
            checked={shareEditorContext}
            onChange={(e) => onToggleShareEditorContext?.(e.target.checked)}
            disabled={isSending || !canShareEditorContext}
          />
          <span style={{ opacity: canShareEditorContext ? 1 : 0.6 }}>
            Partager le contexte editeur
          </span>
        </label>
      </div>

      {/* Editor Context Indicator */}
      {editorContext && (
        <div className={styles.contextInfo}>
          <Zap size={12} />
          <span>Context: Editor content active</span>
        </div>
      )}

      {/* Messages Area */}
      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>👋 Start a conversation</p>
            <p className={styles.hint}>Type a message to begin chatting with the agent</p>
          </div>
        ) : (
          messages.map((msg) => {
            const agentName = msg.role === 'assistant' && msg.agentId 
              ? agents.find((a) => a.id === msg.agentId)?.name || 'Agent'
              : null;
            
            return (
              <ChatMessage
                key={msg.id}
                id={msg.id}
                content={msg.content}
                role={msg.role}
                timestamp={msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)}
                agentName={agentName || undefined}
                status="sent"
              />
            );
          })
        )}

        {/* Error Message */}
        {workflowError && (
          <div className={styles.errorMessage}>
            <AlertCircle size={16} />
            <div className={styles.errorContent}>
              <strong>Error:</strong> {workflowError.message}
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={onSendMessage}
        isLoading={isSending}
        onStop={onStop}
        placeholder="Ask the agent something... (Shift+Enter for new line)"
      />

      {/* Info Footer */}
      <div className={styles.rules}>
        <AlertCircle size={12} />
        <span>💡 Tip: Your editor context is sent to the agent for better responses</span>
      </div>
    </div>
  );
};
