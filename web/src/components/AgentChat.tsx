import React, { useState } from 'react';
import { Send, AlertCircle, ChevronDown, Zap, Download, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage, Agent } from '../types/index';
import styles from './AgentChat.module.css';

export interface AgentChatProps {
  agents: Agent[];
  selectedAgentId?: string;
  onAgentSelect: (agentId: string) => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onSaveToVault?: (content: string) => void;
  onStop?: () => void;
  isLoading?: boolean;
  workflowError?: Error | null;
  editorContext?: string;
}

export const AgentChat: React.FC<AgentChatProps> = ({
  agents,
  selectedAgentId,
  onAgentSelect,
  messages,
  onSendMessage,
  onSaveToVault,
  onStop,
  isLoading,
  workflowError,
  editorContext,
}) => {
  const [input, setInput] = useState('');
  const [inputRows, setInputRows] = useState(4);  // Start with 4 rows minimum
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Auto-expand textarea based on content - min 4 lines, max 8
    const lines = value.split('\n').length;
    const maxRows = 8;
    setInputRows(Math.min(Math.max(4, lines), maxRows));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
      setInputRows(4);  // Reset to 4 rows minimum
    }
  };

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
      <div className={styles.header}>
        <h2>Agent Chat</h2>
      </div>

      <div className={styles.agentSelector}>
        <div className={styles.selectorLabel}>Agent</div>
        <select
          className={styles.select}
          value={selectedAgentId || ''}
          onChange={(e) => onAgentSelect(e.target.value)}
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
      </div>

      {editorContext && (
        <div className={styles.contextInfo}>
          <Zap size={12} />
          <span>Context: Editor content active</span>
        </div>
      )}

      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Start a conversation</p>
            <p className={styles.hint}>Send a message to begin</p>
          </div>
        ) : (
          messages.map((msg) => {
            const agentName = msg.role === 'assistant' && msg.agentId 
              ? agents.find((a) => a.id === msg.agentId)?.name || 'Agent'
              : null;
            const timestamp = msg.timestamp 
              ? new Date(msg.timestamp).toLocaleString('fr-FR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : null;
            
            return (
              <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
                <div className={styles.role}>
                  {msg.role === 'user' ? 'You' : agentName || 'Agent'}
                  {timestamp && <span className={styles.timestamp}>{timestamp}</span>}
                </div>
                <div className={styles.content}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            );
          })
        )}
        {isLoading && (
          <div className={styles.message + ' ' + styles.assistant}>
            <div className={styles.spinner} />
            <span>Processing...</span>
          </div>
        )}
        {workflowError && (
          <div className={styles.message + ' ' + styles.error}>
            <AlertCircle size={14} />
            <div className={styles.content}>
              <strong>Error:</strong> {workflowError.message}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Ask something... (shift+enter for new line)"
          disabled={isLoading}
          className={styles.input}
          rows={inputRows}
          style={{ resize: 'none' }}
        />
        {isLoading && onStop ? (
          <button
            type="button"
            onClick={onStop}
            className={styles.stopButton}
            title="Stop current request"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={styles.submitButton}
          >
            <Send size={16} />
          </button>
        )}
        {messages.length > 0 && onSaveToVault && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || messages.length === 0}
            className={styles.saveButton}
            title="Save conversation to vault"
          >
            <Download size={16} />
          </button>
        )}
      </form>

      <div className={styles.rules}>
        <AlertCircle size={12} />
        <span>Context: Editor content + last 2 messages sent to LLM</span>
      </div>
    </div>
  );
};
