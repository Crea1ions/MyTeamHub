/**
 * TreeNode.tsx
 * Recursive tree node component for vault file explorer
 * Handles expand/collapse, selection, and metadata display
 */

import React from 'react';
import { ChevronRight, ChevronDown, File, Folder, FileText } from 'lucide-react';
import type { TreeNode as TreeNodeType } from '../lib/vault-utils';
import styles from './TreeNode.module.css';

interface TreeNodeProps {
  node: TreeNodeType;
  level: number;
  onSelect: (path: string) => void;
  onExpand: (path: string) => void;
  selectedPath?: string;
  onFileOpen?: (path: string) => void;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  onSelect,
  onExpand,
  selectedPath,
  onFileOpen,
}) => {
  const isSelected = selectedPath === node.path;
  const isFolder = node.type === 'folder';
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExpand(node.path);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.path);

    // Double-click to open files
    if (node.type === 'file' && onFileOpen) {
      onFileOpen(node.path);
    }
  };

  // Determine icon based on file type
  const getIcon = () => {
    if (isFolder) {
      return node.isExpanded ? (
        <Folder size={16} className={styles.folderIcon} />
      ) : (
        <Folder size={16} className={styles.folderIconCollapsed} />
      );
    }

    // File icons
    if (node.name.endsWith('.md')) {
      return <FileText size={16} className={styles.markdownIcon} />;
    }
    if (node.name.endsWith('.json')) {
      return <File size={16} className={styles.jsonIcon} />;
    }
    if (node.name.endsWith('.yaml') || node.name.endsWith('.yml')) {
      return <File size={16} className={styles.yamlIcon} />;
    }

    return <File size={16} className={styles.fileIcon} />;
  };

  // Determine chevron icon
  const getChevron = () => {
    if (!isFolder || !hasChildren) {
      return <span className={styles.chevronPlaceholder} />;
    }

    return node.isExpanded ? (
      <ChevronDown size={16} className={styles.chevron} />
    ) : (
      <ChevronRight size={16} className={styles.chevron} />
    );
  };

  return (
    <div>
      <div
        className={`${styles.nodeRow} ${isSelected ? styles.selected : ''} ${
          isFolder ? styles.folder : styles.file
        }`}
        style={{ paddingLeft: `${level * 12}px` }}
        onClick={handleSelect}
      >
        <div className={styles.nodeContent}>
          <div
            className={styles.toggleButton}
            onClick={handleToggle}
            title={isFolder ? (node.isExpanded ? 'Collapse' : 'Expand') : ''}
          >
            {getChevron()}
          </div>

          <div className={styles.icon}>{getIcon()}</div>

          <div className={styles.nodeLabel}>
            <span className={styles.nodeName}>{node.name}</span>

            {/* Metadata badges */}
            {node.metadata && (
              <div className={styles.metadata}>
                {node.metadata.agent && (
                  <span className={styles.agentBadge}>{node.metadata.agent}</span>
                )}
                {node.metadata.links && node.metadata.links.length > 0 && (
                  <span className={styles.linkBadge} title={`${node.metadata.links.length} links`}>
                    {node.metadata.links.length}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recursively render children if expanded */}
      {isFolder && node.isExpanded && hasChildren && (
        <div className={styles.childrenContainer}>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              onExpand={onExpand}
              selectedPath={selectedPath}
              onFileOpen={onFileOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;
