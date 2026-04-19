/**
 * VaultExplorer.tsx
 * Main vault file explorer component with tree navigation
 * Features: file tree, search, metadata display, expand/collapse
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import TreeNode from './TreeNode';
import type { TreeNode as TreeNodeType } from '../lib/vault-utils';
import {
  buildVaultTree,
  filterVaultTree,
  toggleNodeExpansion,
  getExpandedPaths,
  restoreExpansionState,
  getTreeStats,
} from '../lib/vault-utils';
import * as api from '../lib/api';
import styles from './VaultExplorer.module.css';

export interface VaultExplorerProps {
  onFileSelect?: (path: string) => void;
  onFileOpen?: (path: string) => void;
  selectedPath?: string;
  initialVaultPath?: string;
}

export const VaultExplorer: React.FC<VaultExplorerProps> = ({
  onFileSelect,
  onFileOpen,
  selectedPath,
  initialVaultPath = '/vault',
}) => {
  const [tree, setTree] = useState<TreeNodeType | null>(null);
  const [displayTree, setDisplayTree] = useState<TreeNodeType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set<string>());
  const [showStats, setShowStats] = useState(false);

  // Load vault file list on mount
  useEffect(() => {
    loadVaultFiles();
  }, []);

  // Update display tree when search term changes
  useEffect(() => {
    if (!tree) return;

    if (searchTerm.trim() === '') {
      setDisplayTree(tree);
    } else {
      const filtered = filterVaultTree(tree, searchTerm);
      setDisplayTree(filtered);
    }
  }, [searchTerm, tree]);

  // Load vault file list from API
  const loadVaultFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get vault structure from API
      const structure = await api.loadVaultStructure(initialVaultPath);

      // Build tree from file list
      const builtTree = buildVaultTree(structure.files, structure.metadata);
      setTree(builtTree);
      setDisplayTree(builtTree);

      // Load saved expansion state from localStorage
      const savedPaths = localStorage.getItem(`vault-expanded-${initialVaultPath}`);
      if (savedPaths) {
        const pathsArray = JSON.parse(savedPaths) as string[];
        const pathsSet = new Set<string>(pathsArray);
        setExpandedPaths(pathsSet);
        restoreExpansionState(builtTree, pathsSet);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load vault';
      setError(message);
      console.error('Error loading vault:', err);
    } finally {
      setIsLoading(false);
    }
  }, [initialVaultPath]);

  // Handle node expansion/collapse
  const handleExpand = useCallback((path: string) => {
    setTree((prevTree) => {
      if (!prevTree) return prevTree;

      const newTree = toggleNodeExpansion(prevTree, path);

      // Update expanded paths for persistence
      const paths = getExpandedPaths(newTree);
      const pathsSet = new Set<string>(paths);
      setExpandedPaths(pathsSet);

      // Save to localStorage
      localStorage.setItem(
        `vault-expanded-${initialVaultPath}`,
        JSON.stringify(paths)
      );

      return newTree;
    });
  }, [initialVaultPath]);

  // Handle file selection
  const handleSelect = useCallback(
    (path: string) => {
      onFileSelect?.(path);
    },
    [onFileSelect]
  );

  // Calculate tree stats
  const stats = useMemo(() => {
    return tree ? getTreeStats(tree) : null;
  }, [tree]);

  if (isLoading) {
    return (
      <div className={styles.explorer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Vault Explorer</h2>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading vault...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.explorer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Vault Explorer</h2>
        </div>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>⚠️ {error}</p>
          <button className={styles.retryButton} onClick={loadVaultFiles}>
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.explorer}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>📁 Vault</h2>
        <button
          className={styles.refreshButton}
          onClick={loadVaultFiles}
          title="Refresh vault"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Search bar */}
      <div className={styles.searchContainer}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search files..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            className={styles.clearButton}
            onClick={() => setSearchTerm('')}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Stats bar */}
      {stats && (
        <div className={styles.statsBar}>
          <button
            className={styles.statsButton}
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span className={styles.statsLabel}>
              {stats.fileCount} files • {stats.folderCount} folders
            </span>
          </button>
          {showStats && (
            <div className={styles.statsDetail}>
              <p>Files: <strong>{stats.fileCount}</strong></p>
              <p>Folders: <strong>{stats.folderCount}</strong></p>
              <p>Max Depth: <strong>{stats.depth}</strong></p>
            </div>
          )}
        </div>
      )}

      {/* Tree view */}
      <div className={styles.treeContainer}>
        {displayTree && displayTree.children.length > 0 ? (
          <div className={styles.tree}>
            {displayTree.children.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                level={0}
                onSelect={handleSelect}
                onExpand={handleExpand}
                selectedPath={selectedPath}
                onFileOpen={onFileOpen}
              />
            ))}
          </div>
        ) : searchTerm ? (
          <div className={styles.emptyState}>
            <p>No files match "{searchTerm}"</p>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Vault is empty</p>
          </div>
        )}
      </div>

      {/* Footer info */}
      {selectedPath && (
        <div className={styles.footer}>
          <p className={styles.footerText}>Selected: {selectedPath}</p>
        </div>
      )}
    </div>
  );
};

export default VaultExplorer;
