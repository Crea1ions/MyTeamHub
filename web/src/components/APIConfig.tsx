import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import type { APIConfig } from '../types/index';
import styles from './APIConfig.module.css';

export interface APIConfigProps {
  config: APIConfig;
  onConfigChange: (config: APIConfig) => void;
}

const STORAGE_KEY = 'myteamhub-api-config';

export const APIConfig: React.FC<APIConfigProps> = ({ config, onConfigChange }) => {
  const [showMistral, setShowMistral] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [localConfig, setLocalConfig] = useState<APIConfig>(config);
  const [saved, setSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLocalConfig(parsed);
        onConfigChange(parsed);
      } catch (e) {
        console.error('Failed to load API config from storage', e);
      }
    }
  }, []);

  const handleChange = (key: keyof APIConfig, value: string) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
    setSaved(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localConfig));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save API config', e);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>API Configuration</h2>
      </div>

      <div className={styles.warning}>
        <AlertCircle size={14} />
        <span>Config saved locally • Never sent to LLM</span>
      </div>

      <div className={styles.section}>
        <label htmlFor="mistral-key">Mistral API Key</label>
        <div className={styles.secretInput}>
          <input
            id="mistral-key"
            type={showMistral ? 'text' : 'password'}
            value={localConfig.mistralApiKey}
            onChange={(e) => handleChange('mistralApiKey', e.target.value)}
            placeholder="sk-..."
            aria-label="Mistral API Key"
          />
          <button 
            onClick={() => setShowMistral(!showMistral)} 
            title="Toggle visibility"
            aria-pressed={showMistral}
            className={styles.toggleButton}
          >
            {showMistral ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <span className={styles.hint}>Used by Mistral LLM integration</span>
      </div>

      <div className={styles.section}>
        <label htmlFor="openai-key">OpenAI API Key</label>
        <div className={styles.secretInput}>
          <input
            id="openai-key"
            type={showOpenAI ? 'text' : 'password'}
            value={localConfig.openaiApiKey}
            onChange={(e) => handleChange('openaiApiKey', e.target.value)}
            placeholder="sk-..."
            aria-label="OpenAI API Key"
          />
          <button 
            onClick={() => setShowOpenAI(!showOpenAI)} 
            title="Toggle visibility"
            aria-pressed={showOpenAI}
            className={styles.toggleButton}
          >
            {showOpenAI ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <span className={styles.hint}>Optional: For future integrations</span>
      </div>

      <div className={styles.section}>
        <label htmlFor="vault-path">Vault Path</label>
        <input
          id="vault-path"
          type="text"
          value={localConfig.vaultPath}
          onChange={(e) => handleChange('vaultPath', e.target.value)}
          placeholder="/home/user/.vault"
          className={styles.pathInput}
          aria-label="Vault Path"
        />
        <span className={styles.hint}>Local filesystem path for vault storage</span>
      </div>

      <div className={styles.footer}>
        <button 
          className={styles.testButton}
          onClick={handleSave}
        >
          {saved ? (
            <>
              <Check size={16} />
              Saved!
            </>
          ) : (
            'Save Configuration'
          )}
        </button>
      </div>
    </div>
  );
};
