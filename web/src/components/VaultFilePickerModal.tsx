import React, { useState } from 'react';
import styles from './VaultFilePickerModal.module.css';
import { X } from 'lucide-react';

interface VaultFilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected: (filePath: string) => void;
  isLoading?: boolean;
}

export const VaultFilePickerModal: React.FC<VaultFilePickerModalProps> = ({
  isOpen,
  onClose,
  onFileSelected,
  isLoading = false
}) => {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate: must be markdown
      if (!file.name.endsWith('.md')) {
        setError('Please select a markdown (.md) file');
        return;
      }

      // Store file for processing
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        // For now, just use filename as path
        // In production, would track full vault path
        onFileSelected(file.name);
        setSelectedPath(file.name);
        setError('');
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsText(file);
    }
  };

  const handleManualPath = () => {
    if (!selectedPath.trim()) {
      setError('Please enter a file path');
      return;
    }
    
    if (!selectedPath.endsWith('.md')) {
      setError('Path must point to a .md file');
      return;
    }

    onFileSelected(selectedPath);
    setError('');
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Load from Vault</h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            Select a markdown file from your vault or enter its path.
          </p>

          {/* File Picker */}
          <div className={styles.section}>
            <label className={styles.label}>Select File</label>
            <input
              type="file"
              accept=".md"
              onChange={handleFileInputChange}
              disabled={isLoading}
              className={styles.fileInput}
            />
            <p className={styles.hint}>
              Choose a markdown file to load into the vault explorer
            </p>
          </div>

          {/* Manual Path Input */}
          <div className={styles.divider}>OR</div>
          
          <div className={styles.section}>
            <label className={styles.label}>Enter File Path</label>
            <input
              type="text"
              value={selectedPath}
              onChange={(e) => setSelectedPath(e.target.value)}
              placeholder="e.g., conversations/session-2026-04-18.md"
              disabled={isLoading}
              className={styles.pathInput}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleManualPath();
              }}
            />
            <p className={styles.hint}>
              Enter the vault path (relative to vault root)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          {/* Selected File Preview */}
          {selectedPath && !error && (
            <div className={styles.preview}>
              <p className={styles.previewLabel}>Selected:</p>
              <p className={styles.previewPath}>{selectedPath}</p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.buttonSecondary}
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className={styles.buttonPrimary}
            onClick={handleManualPath}
            disabled={!selectedPath || isLoading}
          >
            {isLoading ? 'Loading...' : 'Load File'}
          </button>
        </div>
      </div>
    </div>
  );
};
