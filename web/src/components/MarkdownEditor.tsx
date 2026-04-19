import React, { useState } from 'react';
import styles from './MarkdownEditor.module.css';

export interface MarkdownEditorProps {
  fileName: string;
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  fileName,
  content,
  onChange,
  onSave,
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.fileName}>{fileName}</span>
        {!isSaved && <span className={styles.unsaved}>●</span>}
      </div>

      <textarea
        className={styles.editor}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Start typing... (Ctrl+S to save)"
        spellCheck="false"
      />

      <div className={styles.footer}>
        <span className={styles.hint}>Context source for chat system</span>
      </div>
    </div>
  );
};
