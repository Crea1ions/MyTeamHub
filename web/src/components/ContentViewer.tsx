import React, { useMemo, useState } from 'react';
import { Link, Tag, Clock, GitBranch, Edit, Save, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { VaultNote } from '../types/index';
import { TabPanel, type Tab } from './TabPanel';
import { MetadataViewer } from './MetadataViewer';
import { MarkdownLinkRenderer, LinkList, extractLinksFromText } from './MarkdownLinkRenderer';
import { extractMetadata } from '../lib/frontmatter-parser';
import type { ParsedLink } from '../lib/link-parser';
import styles from './ContentViewer.module.css';

export interface ContentViewerProps {
  note?: VaultNote;
  isLoading?: boolean;
  onLinkClick?: (link: ParsedLink) => void;
  onContentSave?: (path: string, content: string) => Promise<void>;
}

/**
 * Check if a vault file is editable
 * Protected directories (system-level): 30-Knowledge, 40-Snippets, 50-Tasks, 60-State, 70-Logs, 80-Protocols, 90-Indexes
 * Editable directories: 00-Inbox, 10-Context, 20-Projects
 */
const isFileEditable = (filePath: string): boolean => {
  const protectedDirs = [
    '30-Knowledge',
    '40-Snippets',
    '50-Tasks',
    '60-State',
    '70-Logs',
    '80-Protocols',
    '90-Indexes',
  ];
  
  return !protectedDirs.some(dir => filePath.startsWith(dir + '/') || filePath === dir);
};

export const ContentViewer: React.FC<ContentViewerProps> = ({ note, isLoading, onLinkClick, onContentSave }) => {
  const [showSecondary, setShowSecondary] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const links = useMemo(
    () => (note ? extractLinksFromText(note.content) : []),
    [note?.content]
  );

  const handleEditStart = () => {
    setEditContent(note?.content || '');
    setIsEditing(true);
    setSaveError(null);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent('');
    setSaveError(null);
  };

  const handleEditSave = async () => {
    if (!note || !onContentSave) return;
    
    try {
      setIsSaving(true);
      setSaveError(null);
      await onContentSave(note.path, editContent);
      
      // Update note object (readonly, will trigger reload in parent)
      setIsEditing(false);
      setEditContent('');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save';
      setSaveError(errorMsg);
      console.error('Error saving file:', error);
    } finally {
      setIsSaving(false);
    }
  };

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

  // Build secondary tabs
  const secondaryTabs: Tab[] = [];

  if (links.length > 0) {
    secondaryTabs.push({
      id: 'links',
      label: 'Links',
      badge: links.length,
      content: (
        <LinkList
          content={note.content}
          onLinkClick={onLinkClick}
        />
      ),
    });
  }

  if (note.tags.length > 0) {
    secondaryTabs.push({
      id: 'tags',
      label: 'Tags',
      badge: note.tags.length,
      content: (
        <div className={styles.tagsList}>
          {note.tags.map((tag) => (
            <span key={tag} className={styles.tagBadge}>
              #{tag}
            </span>
          ))}
        </div>
      ),
    });
  }

  secondaryTabs.push({
    id: 'metadata',
    label: 'Metadata',
    content: (
      <MetadataViewer
        metadata={extractMetadata(note.content)}
        filePath={note.path}
      />
    ),
  });

  return (
    <div className={styles.container}>
      {/* HEADER - Always visible */}
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
        
        {/* Header buttons */}
        <div className={styles.headerButtons}>
          {isEditing ? (
            <>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleEditSave}
                disabled={isSaving}
                title="Save changes"
              >
                <Save size={14} />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={handleEditCancel}
                disabled={isSaving}
                title="Cancel editing"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={handleEditStart}
              disabled={!isFileEditable(note.path)}
              title={isFileEditable(note.path) ? "Edit this file" : "This file is read-only (system directory)"}
            >
              <Edit size={14} />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Save error message */}
      {saveError && (
        <div className={styles.errorBanner}>
          <span>❌ {saveError}</span>
        </div>
      )}

      {/* CONTENT - Prioritaire (flex: 1) */}
      <div className={styles.mainContent}>
        {isEditing ? (
          <textarea
            className={styles.editor}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Enter markdown content..."
            autoFocus
          />
        ) : (
          <ReactMarkdown
            className={styles.markdownContent}
            breaks={true}
            components={{
              h1: ({ node, ...props }) => <h1 className={styles.h1} {...props} />,
              h2: ({ node, ...props }) => <h2 className={styles.h2} {...props} />,
              h3: ({ node, ...props }) => <h3 className={styles.h3} {...props} />,
              p: ({ node, ...props }) => <p className={styles.p} {...props} />,
              ul: ({ node, ...props }) => <ul className={styles.ul} {...props} />,
              ol: ({ node, ...props }) => <ol className={styles.ol} {...props} />,
              li: ({ node, ...props }) => <li className={styles.li} {...props} />,
              code: ({ node, inline, ...props }) => 
                inline ? (
                  <code className={styles.inlineCode} {...props} />
                ) : (
                  <code className={styles.blockCode} {...props} />
                ),
              pre: ({ node, ...props }) => <pre className={styles.pre} {...props} />,
              blockquote: ({ node, ...props }) => <blockquote className={styles.blockquote} {...props} />,
              a: ({ node, href, children, ...props }) => (
                <a 
                  className={styles.link}
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    // Try to parse as wikilink
                    const target = href?.replace(/^\/vault\//, '').replace(/\.md$/, '') || '';
                    onLinkClick?.({ type: 'obsidian', target, isValid: true });
                  }}
                  {...props}
                >
                  {children}
                </a>
              ),
            }}
          >
            {note.content}
          </ReactMarkdown>
        )}
      </div>

      {/* SECONDARY PANELS - Compact tabs */}
      {showSecondary && secondaryTabs.length > 0 && (
        <div className={styles.secondaryPanels}>
          <TabPanel
            tabs={secondaryTabs}
            defaultTab={secondaryTabs[0]?.id}
            onClose={() => setShowSecondary(false)}
          />
        </div>
      )}

      {/* Quick toggle for secondary panels */}
      {!showSecondary && (
        <div className={styles.toggleBar}>
          <button
            className={styles.toggleBtn}
            onClick={() => setShowSecondary(true)}
            title="Show secondary panels (Links, Tags, Metadata)"
          >
            ▼ Show Details
          </button>
        </div>
      )}
    </div>
  );
};
