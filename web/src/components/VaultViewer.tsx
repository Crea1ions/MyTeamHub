import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import styles from './VaultViewer.module.css';

export interface VaultViewerProps {
  filePath?: string;
  onClose?: () => void;
  onOpenInStudio?: (path: string) => void;
}

export const VaultViewer: React.FC<VaultViewerProps> = ({
  filePath,
  onClose,
  onOpenInStudio,
}) => {
  if (!filePath) {
    return null;
  }

  const sampleContent = {
    title: filePath.split('/').pop() || 'File',
    path: filePath,
    source: 'studio',
    agent: 'analyzer',
    created: new Date().toLocaleString(),
    content: 'This is sample content from the Vault file.',
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <h2>{sampleContent.title}</h2>
          <p className={styles.path}>{sampleContent.path}</p>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.button}
            onClick={() => onOpenInStudio?.(filePath)}
            title="Open in Studio"
          >
            <ExternalLink size={16} />
            Open in Studio
          </button>
          <button
            className={styles.closeButton}
            onClick={onClose}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className={styles.metadata}>
        <div className={styles.metadataItem}>
          <span className={styles.label}>Source:</span>
          <span>{sampleContent.source}</span>
        </div>
        <div className={styles.metadataItem}>
          <span className={styles.label}>Agent:</span>
          <span>{sampleContent.agent}</span>
        </div>
        <div className={styles.metadataItem}>
          <span className={styles.label}>Created:</span>
          <span>{sampleContent.created}</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.markdown}>{sampleContent.content}</div>
      </div>
    </div>
  );
};
