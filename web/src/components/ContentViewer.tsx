import React, { useMemo } from 'react';
import { Link, Tag, Clock, GitBranch } from 'lucide-react';
import type { VaultNote } from '../types/index';
import { MetadataViewer } from './MetadataViewer';
import { MarkdownLinkRenderer, LinkList, extractLinksFromText } from './MarkdownLinkRenderer';
import { extractMetadata } from '../lib/frontmatter-parser';
import type { ParsedLink } from '../lib/link-parser';
import styles from './ContentViewer.module.css';

export interface ContentViewerProps {
  note?: VaultNote;
  isLoading?: boolean;
  onLinkClick?: (link: ParsedLink) => void;
}

export const ContentViewer: React.FC<ContentViewerProps> = ({ note, isLoading, onLinkClick }) => {
  const links = useMemo(
    () => (note ? extractLinksFromText(note.content) : []),
    [note?.content]
  );

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Content</h2>
        </div>
        <div className={styles.empty}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Content</h2>
        </div>
        <div className={styles.empty}>
          <p>Select a note to view</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>{note.title}</h2>
          <div className={styles.meta}>
            <span className={styles.type}>{note.type}</span>
            <span className={styles.date}>
              <Clock size={12} />
              {new Date(note.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <MarkdownLinkRenderer
          content={note.content}
          onLinkClick={onLinkClick}
          showTooltips={true}
          highlightDeadLinks={true}
        />
      </div>

      {links.length > 0 && (
        <div className={styles.section}>
          <h3>
            <GitBranch size={14} />
            Links ({links.length})
          </h3>
          <LinkList
            content={note.content}
            onLinkClick={onLinkClick}
          />
        </div>
      )}

      {note.tags.length > 0 && (
        <div className={styles.section}>
          <h3>
            <Tag size={14} />
            Tags
          </h3>
          <div className={styles.tags}>
            {note.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {note.backlinks.length > 0 && (
        <div className={styles.section}>
          <h3>
            <Link size={14} />
            Backlinks
          </h3>
          <div className={styles.backlinks}>
            {note.backlinks.map((link) => (
              <div key={link} className={styles.backlink}>
                {link}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Viewer */}
      <div className={styles.metadataSection}>
        <MetadataViewer
          metadata={extractMetadata(note.content)}
          filePath={note.path}
        />
      </div>

      <div className={styles.footer}>
        <span className={styles.hint}>Read-only view</span>
      </div>
    </div>
  );
};
