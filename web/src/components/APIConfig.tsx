import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { APIConfig } from '../types/index';
import styles from './APIConfig.module.css';

export interface APIConfigProps {
  config: APIConfig;
  onConfigChange: (config: APIConfig) => void;
}

export const APIConfig: React.FC<APIConfigProps> = ({ config, onConfigChange }) => {
  const [showMistral, setShowMistral] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);

  const handleChange = (key: keyof APIConfig, value: string) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>API Configuration</h2>
      </div>

      <div className={styles.warning}>
        <AlertCircle size={14} />
        <span>Never sent to LLM • Never synced to vault</span>
      </div>

      <div className={styles.section}>
        <label>Mistral API Key</label>
        <div className={styles.secretInput}>
          <input
            type={showMistral ? 'text' : 'password'}
            value={config.mistralApiKey}
            onChange={(e) => handleChange('mistralApiKey', e.target.value)}
            placeholder="sk-..."
          />
          <button onClick={() => setShowMistral(!showMistral)} title="Toggle visibility">
            {showMistral ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <span className={styles.hint}>Used by Mistral LLM integration</span>
      </div>

      <div className={styles.section}>
        <label>OpenAI API Key</label>
        <div className={styles.secretInput}>
          <input
            type={showOpenAI ? 'text' : 'password'}
            value={config.openaiApiKey}
            onChange={(e) => handleChange('openaiApiKey', e.target.value)}
            placeholder="sk-..."
          />
          <button onClick={() => setShowOpenAI(!showOpenAI)} title="Toggle visibility">
            {showOpenAI ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <span className={styles.hint}>Optional: For future integrations</span>
      </div>

      <div className={styles.section}>
        <label>Vault Path</label>
        <input
          type="text"
          value={config.vaultPath}
          onChange={(e) => handleChange('vaultPath', e.target.value)}
          placeholder="/home/user/.vault"
          className={styles.pathInput}
        />
        <span className={styles.hint}>Local filesystem path for vault storage</span>
      </div>

      <div className={styles.footer}>
        <button className={styles.testButton}>Test Connection</button>
      </div>
    </div>
  );
};
