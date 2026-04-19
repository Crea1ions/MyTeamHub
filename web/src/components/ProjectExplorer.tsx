import React, { useState } from 'react';
import { ChevronRight, FileText, Folder, Plus, Search, Download } from 'lucide-react';
import type { ProjectFile } from '../types/index';
import styles from './ProjectExplorer.module.css';

export interface ProjectExplorerProps {
  files: ProjectFile[];
  selectedFileId?: string;
  onFileSelect: (file: ProjectFile) => void;
  onLoadFromVault?: () => void; // Phase 5.4: Load from Vault callback
}

const FileTreeItem: React.FC<{
  file: ProjectFile;
  level: number;
  isSelected: boolean;
  onSelect: (file: ProjectFile) => void;
}> = ({ file, level, isSelected, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasChildren = file.children && file.children.length > 0;

  return (
    <div>
      <div
        className={`${styles.treeItem} ${isSelected ? styles.selected : ''}`}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={() => {
          if (file.type === 'folder') {
            setIsExpanded(!isExpanded);
          }
          onSelect(file);
        }}
      >
        {hasChildren && (
          <ChevronRight
            size={16}
            style={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        )}
        {!hasChildren && <div style={{ width: 16 }} />}

        {file.type === 'folder' ? (
          <Folder size={16} color="#8b98a5" />
        ) : (
          <FileText size={16} color="#4c8dff" />
        )}
        <span className={styles.label}>{file.name}</span>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {file.children!.map((child) => (
            <FileTreeItem
              key={child.id}
              file={child}
              level={level + 1}
              isSelected={false}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({
  files,
  selectedFileId,
  onFileSelect,
  onLoadFromVault, // Phase 5.4
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Projects</h2>
        <div className={styles.headerButtons}>
          {onLoadFromVault && (
            <button 
              className={styles.headerButton} 
              title="Load from Vault"
              onClick={onLoadFromVault}
            >
              <Download size={16} />
            </button>
          )}
          <button className={styles.headerButton} title="New file">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className={styles.searchBox}>
        <Search size={14} />
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.fileTree}>
        {files.map((file) => (
          <FileTreeItem
            key={file.id}
            file={file}
            level={0}
            isSelected={file.id === selectedFileId}
            onSelect={onFileSelect}
          />
        ))}
      </div>
    </div>
  );
};
