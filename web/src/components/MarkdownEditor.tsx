import React, { useState } from 'react';
import styles from './MarkdownEditor.module.css';

export interface MarkdownEditorProps {
  fileName: string;
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  saveError?: string | null;
  lastSaveTime?: Date | null;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  fileName,
  content,
  onChange,
  onSave,
  saveStatus = 'idle',
  saveError = null,
  lastSaveTime = null,
}) => {
  const [isSaved, setIsSaved] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setIsSaved(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave?.();
      setIsSaved(true);
    }
  };

  // Determine visual status indicator
  const getStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return <span className={styles.statusSaving}>💾 Saving...</span>;
      case 'saved':
        return <span className={styles.statusSaved}>✅ Saved</span>;
      case 'error':
        return <span className={styles.statusError}>❌ Save failed</span>;
      default:
        return isSaved ? null : <span className={styles.unsaved}>●</span>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.fileName}>{fileName}</span>
        <div className={styles.statusArea}>
          {getStatusIndicator()}
          {lastSaveTime && saveStatus === 'idle' && (
            <span className={styles.lastSaveTime}>
              Last saved: {lastSaveTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <textarea
        className={styles.editor}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Start typing... (Ctrl+S or Cmd+S to save)"
        spellCheck="false"
      />

      {saveError && (
        <div className={styles.errorBox}>
          <p className={styles.errorMessage}>{saveError}</p>
          <button onClick={onSave} className={styles.retryButton}>
            Retry Save
          </button>
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.hint}>Context source for chat system</span>
      </div>
    </div>
  );
};
