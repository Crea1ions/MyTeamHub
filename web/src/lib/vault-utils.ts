/**
 * Vault Tree Building Utilities
 * Converts flat file paths into hierarchical tree structure
 * Used by VaultExplorer for navigation
 */

export interface TreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: TreeNode[];
  isExpanded: boolean;
  metadata?: {
    agent?: string;
    created_at?: string;
    links?: string[];
  };
}

/**
 * Build hierarchical tree from flat file paths
 * @param files - Array of file paths (e.g., ['vault/projects/file.md', 'vault/notes/note.md'])
 * @param metadata - Optional metadata for files
 * @returns Root tree node containing all files
 */
export function buildVaultTree(
  files: string[] = [],
  metadata?: Record<string, any>
): TreeNode {
  const root: TreeNode = {
    id: 'root',
    name: 'Vault',
    path: '',
    type: 'folder',
    children: [],
    isExpanded: true,
  };

  // Handle empty or invalid files array
  if (!files || !Array.isArray(files) || files.length === 0) {
    console.log('No files to build tree from');
    return root;
  }

  // Sort files for consistent ordering
  // Filter out any undefined/null entries first
  const validFiles = files.filter((f): f is string => {
    if (!f || typeof f !== 'string') {
      console.warn('Filtering invalid file entry:', f);
      return false;
    }
    return true;
  });

  const sortedFiles = [...validFiles].sort();

  sortedFiles.forEach((filePath) => {
    const parts = filePath.split('/').filter(p => p.length > 0);
    
    // Skip if path is empty after splitting
    if (parts.length === 0) {
      console.warn('Skipping empty path:', filePath);
      return;
    }

    let current = root;

    // Navigate/create folder hierarchy
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLastPart = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      // Find or create node
      let node = current.children.find((child) => child.name === part);

      if (!node) {
        node = {
          id: currentPath,
          name: part,
          path: currentPath,
          type: isLastPart && part.endsWith('.md') ? 'file' : 'folder',
          children: [],
          isExpanded: i < 2, // Expand first 2 levels by default
          metadata: isLastPart ? metadata?.[filePath] : undefined,
        };
        current.children.push(node);
      }

      current = node;
    }
  });

  // Sort children at each level (folders first, then files)
  sortTreeChildren(root);
  return root;

}

/**
 * Sort tree children: folders first (alphabetical), then files (alphabetical)
 */
function sortTreeChildren(node: TreeNode): void {
  node.children.sort((a, b) => {
    // Folders before files
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    // Alphabetical within same type
    return a.name.localeCompare(b.name);
  });

  // Recursively sort children
  node.children.forEach((child) => sortTreeChildren(child));
}

/**
 * Find a node by path
 */
export function findNodeByPath(root: TreeNode, path: string): TreeNode | null {
  if (root.path === path) return root;

  for (const child of root.children) {
    const found = findNodeByPath(child, path);
    if (found) return found;
  }

  return null;
}

/**
 * Toggle node expansion state
 */
export function toggleNodeExpansion(root: TreeNode, nodePath: string): TreeNode {
  const node = findNodeByPath(root, nodePath);
  if (node) {
    node.isExpanded = !node.isExpanded;
  }
  return { ...root }; // Return new reference for React re-render
}

/**
 * Get all expanded node paths (for saving state)
 */
export function getExpandedPaths(node: TreeNode, paths: string[] = []): string[] {
  if (node.isExpanded && node.type === 'folder') {
    paths.push(node.path);
  }
  node.children.forEach((child) => getExpandedPaths(child, paths));
  return paths;
}

/**
 * Restore expansion state from saved paths
 */
export function restoreExpansionState(node: TreeNode, expandedPaths: Set<string>): void {
  node.isExpanded = expandedPaths.has(node.path);
  node.children.forEach((child) => restoreExpansionState(child, expandedPaths));
}

/**
 * Filter tree by search term
 * Returns a new tree with only matching files and their parent folders
 */
export function filterVaultTree(node: TreeNode, searchTerm: string): TreeNode | null {
  const lowerSearch = searchTerm.toLowerCase();
  let hasMatches = false;

  // Filter children
  const filteredChildren: TreeNode[] = [];
  for (const child of node.children) {
    const filtered = filterVaultTree(child, searchTerm);
    if (filtered) {
      filteredChildren.push(filtered);
      hasMatches = true;
    }
  }

  // Check if this node matches
  const nodeMatches =
    node.type === 'file' && node.name.toLowerCase().includes(lowerSearch);

  // Include node if it matches or has matching children
  if (nodeMatches || hasMatches) {
    return {
      ...node,
      children: filteredChildren,
      isExpanded: hasMatches || node.isExpanded, // Expand if has matches
    };
  }

  return null;
}

/**
 * Get all files (leaf nodes) from tree
 */
export function getAllFiles(node: TreeNode, files: TreeNode[] = []): TreeNode[] {
  if (node.type === 'file') {
    files.push(node);
  }
  node.children.forEach((child) => getAllFiles(child, files));
  return files;
}

/**
 * Get breadcrumb path for a file
 * e.g., 'vault/projects/file.md' → [vault, projects]
 */
export function getBreadcrumbPath(filePath: string): string[] {
  const parts = filePath.split('/');
  // Remove the last part (filename) and the root
  return parts.slice(0, -1).filter((part) => part && part !== 'vault');
}

/**
 * Calculate tree statistics
 */
export function getTreeStats(node: TreeNode): {
  fileCount: number;
  folderCount: number;
  depth: number;
} {
  const files = getAllFiles(node);
  const fileCount = files.length;

  let maxDepth = 0;
  function calcDepth(n: TreeNode, depth: number = 0) {
    maxDepth = Math.max(maxDepth, depth);
    n.children.forEach((child) => calcDepth(child, depth + 1));
  }
  calcDepth(node);

  let folderCount = 0;
  function countFolders(n: TreeNode) {
    if (n.type === 'folder') folderCount++;
    n.children.forEach((child) => countFolders(child));
  }
  countFolders(node);

  return { fileCount, folderCount, depth: maxDepth };
}

/**
 * Get parent node path
 */
export function getParentPath(path: string): string {
  const parts = path.split('/');
  return parts.slice(0, -1).join('/');
}

/**
 * Check if file is under folder
 */
export function isFileUnderFolder(filePath: string, folderPath: string): boolean {
  return filePath.startsWith(folderPath + '/');
}
