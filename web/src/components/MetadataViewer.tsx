/**
 * MetadataViewer.tsx
 * Display file metadata (frontmatter) in a readable format
 */

import React from 'react';
import { Tag, Clock, Users, Link2 } from 'lucide-react';
import type { ExtractedMetadata } from '../lib/frontmatter-parser';
import styles from './MetadataViewer.module.css';

interface MetadataViewerProps {
  metadata: ExtractedMetadata;
  filePath?: string;
}

export const MetadataViewer: React.FC<MetadataViewerProps> = ({
  metadata,
  filePath,
}) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>No metadata</p>
      </div>
    );
  }

  const renderValue = (value: any): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <div className={styles.arrayValue}>
          {value.map((item, idx) => (
            <span key={idx} className={styles.arrayItem}>
              {typeof item === 'string' && item.includes('[[')
                ? item
                : String(item)}
            </span>
          ))}
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return <code className={styles.codeValue}>{JSON.stringify(value)}</code>;
    }

    return <span className={styles.textValue}>{String(value)}</span>;
  };

  const getIcon = (key: string) => {
    switch (key.toLowerCase()) {
      case 'agent':
        return <Users size={14} />;
      case 'tags':
        return <Tag size={14} />;
      case 'links':
        return <Link2 size={14} />;
      case 'created_at':
      case 'updated_at':
        return <Clock size={14} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>📋 Metadata</h3>
      </div>

      <div className={styles.content}>
        {Object.entries(metadata).map(([key, value]) => (
          <div key={key} className={styles.field}>
            <div className={styles.fieldHeader}>
              <span className={styles.icon}>{getIcon(key)}</span>
              <span className={styles.fieldLabel}>{formatFieldName(key)}</span>
            </div>
            <div className={styles.fieldValue}>{renderValue(value)}</div>
          </div>
        ))}
      </div>

      {filePath && (
        <div className={styles.footer}>
          <p className={styles.filePath}>{filePath}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Format field name from key (snake_case -> Title Case)
 */
function formatFieldName(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default MetadataViewer;
