import React from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './ChatMessage.module.css';

export interface ChatMessageProps {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  agentName?: string;
  status?: 'sent' | 'sending' | 'error';
  isStreaming?: boolean;
}

/**
 * ChatMessage: Renders a single chat message as a bubble
 * - User messages: right-aligned, blue background
 * - Assistant messages: left-aligned, gray background
 * - Supports streaming indicator
 * - Displays timestamp and agent name
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  content,
  role,
  timestamp,
  agentName,
  status = 'sent',
  isStreaming = false,
}) => {
  const formattedTime = timestamp.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const bubbleClassName =
    role === 'user'
      ? `${styles.bubble} ${styles.userBubble}`
      : `${styles.bubble} ${styles.assistantBubble}`;

  const containerClassName =
    role === 'user'
      ? `${styles.messageContainer} ${styles.userMessage}`
      : `${styles.messageContainer} ${styles.assistantMessage}`;

  return (
    <div className={containerClassName}>
      {/* Assistant avatar/indicator (left side for assistant messages) */}
      {role === 'assistant' && (
        <div className={styles.avatar}>
          <span className={styles.agentIcon}>🤖</span>
        </div>
      )}

      <div className={styles.messageContent}>
        {/* Agent name and timestamp (for assistant only) */}
        {role === 'assistant' && agentName && (
          <div className={styles.messageMetadata}>
            <span className={styles.agentName}>{agentName}</span>
            <span className={styles.timestamp}>{formattedTime}</span>
          </div>
        )}

        {/* Message bubble */}
        <div className={bubbleClassName}>
          {isStreaming && <div className={styles.streamingIndicator}>✍️</div>}
          
          {role === 'assistant' ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            content
          )}

          {/* Status indicator (superscript) */}
          <span className={`${styles.statusIndicator} ${styles[status]}`}>
            {status === 'sending' && '⏳'}
            {status === 'sent' && '✓'}
            {status === 'error' && '❌'}
          </span>
        </div>

        {/* Timestamp for user messages (below bubble) */}
        {role === 'user' && (
          <span className={styles.userTimestamp}>{formattedTime}</span>
        )}
      </div>

      {/* User avatar/indicator (right side for user messages) */}
      {role === 'user' && (
        <div className={styles.avatar}>
          <span className={styles.userIcon}>👤</span>
        </div>
      )}
    </div>
  );
};
