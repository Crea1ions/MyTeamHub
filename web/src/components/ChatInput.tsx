import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import styles from './ChatInput.module.css';

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  onStop?: () => void;
  placeholder?: string;
}

/**
 * ChatInput: Modern chat input area with:
 * - Auto-expanding textarea (min 2 lines, max 6 lines)
 * - Clear send button
 * - Upload area (UI ready, functionality optional in V2)
 * - Fixed to bottom of chat panel
 * - Keyboard shortcuts: Enter to send, Shift+Enter for new line
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading = false,
  onStop,
  placeholder = 'Type your message... (Shift+Enter for new line)',
}) => {
  const [input, setInput] = useState('');
  const [rows, setRows] = useState(2);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxRows = 6;
  const minRows = 2;

  // Auto-expand textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = parseInt(window.getComputedStyle(textareaRef.current).lineHeight);
      const newRows = Math.min(Math.max(Math.ceil(scrollHeight / lineHeight), minRows), maxRows);
      setRows(newRows);
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (unless Shift is held)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !isLoading) {
      onSendMessage(trimmed);
      setInput('');
      setRows(minRows);
      // Focus back on textarea
      textareaRef.current?.focus();
    }
  };

  return (
    <div className={styles.container}>
      {/* Optional upload area - UI only for V1 */}
      <div className={styles.uploadHint}>
        <Paperclip size={12} />
        <span>Drag files to attach (coming soon)</span>
      </div>

      <div className={styles.inputArea}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          disabled={isLoading}
          className={styles.textarea}
          spellCheck="true"
        />

        <div className={styles.actions}>
          {isLoading ? (
            <button
              onClick={onStop}
              className={styles.stopButton}
              title="Stop message generation"
            >
              ⏹
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={styles.sendButton}
              title="Send message (Ctrl+Enter or Cmd+Enter)"
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Character counter (optional) */}
      <div className={styles.charCounter}>
        {input.length > 0 && (
          <span>{input.length} character{input.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
};
