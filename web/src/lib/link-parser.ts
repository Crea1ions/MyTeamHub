/**
 * Link Parser for Vault
 * Handles both Obsidian [[...]] and Markdown [...](path) formats
 */

export interface ParsedLink {
  type: 'obsidian' | 'markdown';
  text: string;
  target: string;
  raw: string;
  isValid: boolean;
  isDead?: boolean;
}

export interface LinkRenderSegment {
  type: 'text' | 'link';
  content: string;
  link?: ParsedLink;
}

/**
 * Parse Obsidian-style links: [[path/to/file.md]] or [[path/to/file.md|Display Text]]
 */
export function parseObsidianLink(raw: string): ParsedLink | null {
  const obsidianRegex = /^\[\[([^\|\]]+)(?:\|([^\]]+))?\]\]$/;
  const match = raw.match(obsidianRegex);

  if (!match) return null;

  const target = match[1].trim();
  const displayText = match[2]?.trim() || target;

  return {
    type: 'obsidian',
    text: displayText,
    target: normalizeVaultPath(target),
    raw,
    isValid: isValidVaultPath(target),
  };
}

/**
 * Parse Markdown-style links: [text](path/to/file)
 */
export function parseMarkdownLink(raw: string): ParsedLink | null {
  const markdownRegex = /^\[([^\]]+)\]\(([^\)]+)\)$/;
  const match = raw.match(markdownRegex);

  if (!match) return null;

  const text = match[1].trim();
  const target = match[2].trim();

  // Only treat as vault link if it points to .md or has no extension
  const isVaultLink = target.endsWith('.md') || !target.includes('.');

  if (!isVaultLink) {
    // It's an external link, but we still parse it
    return {
      type: 'markdown',
      text,
      target,
      raw,
      isValid: true,
    };
  }

  return {
    type: 'markdown',
    text,
    target: normalizeVaultPath(target),
    raw,
    isValid: isValidVaultPath(target),
  };
}

/**
 * Extract all links from text content
 */
export function extractLinksFromText(content: string): ParsedLink[] {
  const links: ParsedLink[] = [];

  // Find all [[...]] patterns
  const obsidianPattern = /\[\[([^\|\]]+)(?:\|([^\]]+))?\]\]/g;
  let match;

  while ((match = obsidianPattern.exec(content)) !== null) {
    const target = match[1].trim();
    const displayText = match[2]?.trim() || target;
    const raw = match[0];

    links.push({
      type: 'obsidian',
      text: displayText,
      target: normalizeVaultPath(target),
      raw,
      isValid: isValidVaultPath(target),
    });
  }

  // Find all [...](path) patterns
  const markdownPattern = /\[([^\]]+)\]\(([^\)]+)\)/g;

  while ((match = markdownPattern.exec(content)) !== null) {
    const text = match[1].trim();
    const target = match[2].trim();
    const raw = match[0];

    // Only treat as vault link if it's a vault reference
    if (target.endsWith('.md') || !target.includes('.')) {
      links.push({
        type: 'markdown',
        text,
        target: normalizeVaultPath(target),
        raw,
        isValid: isValidVaultPath(target),
      });
    }
  }

  return links;
}

/**
 * Split text into segments (text and links)
 */
export function splitIntoSegments(content: string): LinkRenderSegment[] {
  const segments: LinkRenderSegment[] = [];
  let lastIndex = 0;

  // Combined regex for both Obsidian and Markdown links
  const combinedPattern =
    /\[\[([^\|\]]+)(?:\|([^\]]+))?\]\]|\[([^\]]+)\]\(([^\)]+)\)/g;
  let match;

  while ((match = combinedPattern.exec(content)) !== null) {
    // Add text before link
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex, match.index),
      });
    }

    // Determine link type and parse
    let link: ParsedLink | null = null;

    if (match[1] !== undefined) {
      // Obsidian link
      const target = match[1].trim();
      const displayText = match[2]?.trim() || target;
      link = {
        type: 'obsidian',
        text: displayText,
        target: normalizeVaultPath(target),
        raw: match[0],
        isValid: isValidVaultPath(target),
      };
    } else if (match[3] !== undefined) {
      // Markdown link
      const text = match[3].trim();
      const target = match[4].trim();
      if (target.endsWith('.md') || !target.includes('.')) {
        link = {
          type: 'markdown',
          text,
          target: normalizeVaultPath(target),
          raw: match[0],
          isValid: isValidVaultPath(target),
        };
      }
    }

    if (link) {
      segments.push({
        type: 'link',
        content: match[0],
        link,
      });
    } else {
      segments.push({
        type: 'text',
        content: match[0],
      });
    }

    lastIndex = combinedPattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.substring(lastIndex),
    });
  }

  return segments;
}

/**
 * Normalize vault paths
 * Examples:
 *   "projects/ui" → "projects/ui"
 *   "projects/ui.md" → "projects/ui.md"
 *   "./projects/ui" → "projects/ui"
 *   "projects/./ui" → "projects/ui"
 */
export function normalizeVaultPath(path: string): string {
  return path
    .replace(/^\.\//, '') // Remove leading ./
    .replace(/\/\.\//g, '/') // Remove /./ in middle
    .replace(/\/$/, '') // Remove trailing slash
    .toLowerCase();
}

/**
 * Validate vault path format
 */
export function isValidVaultPath(path: string): boolean {
  if (!path || path.trim().length === 0) return false;

  // Check for invalid characters
  if (/[<>:"|?*]/.test(path)) return false;

  // Check for valid path structure
  if (path.startsWith('/') || path.endsWith('/')) return false;

  return true;
}

/**
 * Convert vault path to relative URL for navigation
 */
export function vaultPathToUrl(path: string): string {
  const normalized = normalizeVaultPath(path);

  // Add .md extension if not present
  const withExtension = normalized.endsWith('.md')
    ? normalized
    : `${normalized}.md`;

  return `/vault?file=${encodeURIComponent(withExtension)}`;
}

/**
 * Extract backlinks: find files that link TO the given file
 */
export function findBacklinks(
  targetPath: string,
  allLinks: Map<string, ParsedLink[]>
): string[] {
  const backlinks: string[] = [];
  const normalizedTarget = normalizeVaultPath(targetPath);

  for (const [filePath, links] of allLinks) {
    for (const link of links) {
      if (link.target === normalizedTarget) {
        backlinks.push(filePath);
        break; // Each file contributes only once
      }
    }
  }

  return backlinks;
}

/**
 * Build a link graph: Map of file paths to their outgoing links
 */
export function buildLinkGraph(
  filesContent: Map<string, string>
): Map<string, ParsedLink[]> {
  const graph = new Map<string, ParsedLink[]>();

  for (const [filePath, content] of filesContent) {
    const links = extractLinksFromText(content);
    if (links.length > 0) {
      graph.set(filePath, links);
    }
  }

  return graph;
}

/**
 * Find connected files (1-hop away)
 */
export function findConnectedFiles(
  filePath: string,
  graph: Map<string, ParsedLink[]>
): Set<string> {
  const connected = new Set<string>();

  // Outgoing links
  const outgoing = graph.get(filePath) || [];
  for (const link of outgoing) {
    connected.add(link.target);
  }

  // Incoming links (backlinks)
  for (const [sourcePath, links] of graph) {
    for (const link of links) {
      const normalized = normalizeVaultPath(filePath);
      if (link.target === normalized) {
        connected.add(sourcePath);
      }
    }
  }

  return connected;
}
