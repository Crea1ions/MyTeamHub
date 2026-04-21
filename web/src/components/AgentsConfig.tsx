import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { Agent } from '../types/index';
import styles from './AgentsConfig.module.css';

export interface AgentsConfigProps {
  agents: Agent[];
  onAgentsChange: (agents: Agent[]) => void;
}

export const AgentsConfig: React.FC<AgentsConfigProps> = ({ agents, onAgentsChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editTemperature, setEditTemperature] = useState(0.7);
  const [isCreating, setIsCreating] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentPrompt, setNewAgentPrompt] = useState('');
  const [newAgentTemperature, setNewAgentTemperature] = useState(0.7);
  const [nameError, setNameError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const validateName = (name: string): boolean => {
    if (!name || name.trim().length < 3) {
      setNameError('Agent name must be at least 3 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleStartEdit = (agent: Agent) => {
    setEditingId(agent.id);
    setEditPrompt(agent.prompt);
    setEditTemperature(agent.temperature ?? 0.7);  // Default to 0.7 if undefined
  };

  const handleSaveEdit = (id: string) => {
    const updated = agents.map((a) =>
      a.id === id ? { ...a, prompt: editPrompt, temperature: editTemperature } : a
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

  const handleStartCreateAgent = () => {
    setIsCreating(true);
    setNewAgentName('');
    setNewAgentPrompt('');
    setNameError('');
  };

  const handleCreateAgent = () => {
    if (!validateName(newAgentName)) {
      return;
    }

    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: newAgentName.trim(),
      description: `Custom agent: ${newAgentName.trim()}`,
      prompt: newAgentPrompt || 'You are a helpful assistant.',
      temperature: newAgentTemperature,
      enabled: true,
      status: 'ready',
    };
    
    onAgentsChange([...agents, newAgent]);
    setIsCreating(false);
    setNewAgentName('');
    setNewAgentPrompt('');
    setNewAgentTemperature(0.7);
    
    // Auto-scroll to the new agent
    setTimeout(() => {
      const agentsList = containerRef.current?.querySelector(`.${styles.agentsList}`);
      if (agentsList) {
        agentsList.scrollTop = agentsList.scrollHeight;
      }
    }, 100);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewAgentName('');
    setNewAgentPrompt('');
    setNewAgentTemperature(0.7);
    setNameError('');
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.header}>
        <h2>Agents</h2>
        <button 
          className={styles.addButton} 
          onClick={handleStartCreateAgent}
          title="Create new agent"
          disabled={isCreating}
        >
          <Plus size={16} />
        </button>
      </div>

      <div className={styles.agentsList}>
        {isCreating && (
          <div className={`${styles.agentCard} ${styles.creatingCard}`}>
            <h3 className={styles.creatingTitle}>Create New Agent</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Agent Name *</label>
              <input
                type="text"
                value={newAgentName}
                onChange={(e) => {
                  setNewAgentName(e.target.value);
                  if (nameError && e.target.value.trim().length >= 3) {
                    setNameError('');
                  }
                }}
                placeholder="e.g., Collaborator, Explorer..."
                className={`${styles.nameInput} ${nameError ? styles.inputError : ''}`}
                autoFocus
              />
              {nameError && <span className={styles.errorText}>{nameError}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Initial Prompt (optional)</label>
              <textarea
                value={newAgentPrompt}
                onChange={(e) => setNewAgentPrompt(e.target.value)}
                placeholder="Enter agent prompt..."
                className={styles.promptInput}
                rows={4}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Temperature: <span className={styles.temperatureValue}>{newAgentTemperature.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={editTemperature ?? 0.7}
                onChange={(e) => setNewAgentTemperature(parseFloat(e.target.value))}
                className={styles.temperatureSlider}
                title="0.0 = deterministic, 1.0 = creative"
              />
              <div className={styles.temperatureHint}>
                <span>Deterministic</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                className={styles.saveButton}
                onClick={handleCreateAgent}
                title="Create agent"
              >
                <Check size={14} />
                Create
              </button>
              <button
                className={styles.cancelButton}
                onClick={handleCancelCreate}
                title="Cancel"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        )}
        
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
                
                <div className={styles.temperatureEditor}>
                  <label>
                    Temperature: <span className={styles.temperatureValue}>{(editTemperature ?? 0.7).toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={editTemperature ?? 0.7}
                    onChange={(e) => setEditTemperature(parseFloat(e.target.value))}
                    className={styles.temperatureSlider}
                    title="0.0 = deterministic, 1.0 = creative"
                  />
                </div>
                
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
                <div className={styles.temperatureDisplay}>
                  Temperature: {(agent.temperature ?? 0.7).toFixed(1)}
                </div>
                <button className={styles.editButton} title="Edit prompt & temperature">
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
