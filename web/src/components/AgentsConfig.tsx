import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';
import type { AgentConfig } from '../types/index';
import styles from './AgentsConfig.module.css';

export interface AgentsConfigProps {
  agents: AgentConfig[];
  onAgentsChange: (agents: AgentConfig[]) => void;
}

export const AgentsConfig: React.FC<AgentsConfigProps> = ({ agents, onAgentsChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');

  const handleStartEdit = (agent: AgentConfig) => {
    setEditingId(agent.id);
    setEditPrompt(agent.prompt);
  };

  const handleSaveEdit = (id: string) => {
    const updated = agents.map((a) =>
      a.id === id ? { ...a, prompt: editPrompt } : a
    );
    onAgentsChange(updated);
    setEditingId(null);
  };

  const handleToggleEnabled = (id: string) => {
    const updated = agents.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    onAgentsChange(updated);
  };

  const handleDelete = (id: string) => {
    onAgentsChange(agents.filter((a) => a.id !== id));
  };

  const handleAddAgent = () => {
    const newAgent: AgentConfig = {
      id: `agent-${Date.now()}`,
      name: 'New Agent',
      prompt: 'You are a helpful assistant.',
      enabled: true,
    };
    onAgentsChange([...agents, newAgent]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Agents</h2>
        <button className={styles.addButton} onClick={handleAddAgent} title="Create agent">
          <Plus size={16} />
        </button>
      </div>

      <div className={styles.agentsList}>
        {agents.map((agent) => (
          <div key={agent.id} className={`${styles.agentCard} ${!agent.enabled ? styles.disabled : ''}`}>
            <div className={styles.agentHeader}>
              <div className={styles.agentName}>
                <input
                  type="checkbox"
                  checked={agent.enabled}
                  onChange={() => handleToggleEnabled(agent.id)}
                  className={styles.checkbox}
                />
                <span className={styles.name}>{agent.name}</span>
              </div>
              <button
                className={styles.deleteButton}
                onClick={() => handleDelete(agent.id)}
                title="Delete agent"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {editingId === agent.id ? (
              <div className={styles.editMode}>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className={styles.promptInput}
                  placeholder="Enter agent prompt..."
                />
                <button
                  className={styles.saveButton}
                  onClick={() => handleSaveEdit(agent.id)}
                >
                  <Check size={14} />
                  Save
                </button>
              </div>
            ) : (
              <div
                className={styles.promptDisplay}
                onClick={() => handleStartEdit(agent)}
              >
                <div className={styles.promptText}>{agent.prompt}</div>
                <button className={styles.editButton} title="Edit prompt">
                  <Edit2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.hint}>{agents.length} agent(s) configured</span>
      </div>
    </div>
  );
};
