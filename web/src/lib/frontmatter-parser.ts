/**
 * frontmatter-parser.ts
 * Parse YAML frontmatter from markdown files
 * Handles both simple YAML and complex structures
 */

export interface Frontmatter {
  [key: string]: any;
}

export interface ParsedMarkdown {
  frontmatter: Frontmatter;
  body: string;
  raw: string;
}

/**
 * Parse YAML frontmatter from markdown content
 * Supports simple key:value pairs and arrays
 *
 * Example:
 * ---
 * source: studio
 * agent: analyzer
 * created_at: 2026-04-18T10:30:00Z
 * tags: [project, vault]
 * links: [[vault/file1]], [[vault/file2]]
 * ---
 * # Content here
 */
export function parseFrontmatter(content: string): ParsedMarkdown {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      frontmatter: {},
      body: content,
      raw: content,
    };
  }

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter = parseYAML(frontmatterStr);

  return {
    frontmatter,
    body,
    raw: content,
  };
}

/**
 * Simple YAML parser (handles common cases)
 * Not a full YAML parser, but sufficient for metadata
 */
function parseYAML(yamlStr: string): Frontmatter {
  const result: Frontmatter = {};

  yamlStr.split('\n').forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;

    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    if (!key) return;

    // Parse value
    result[key] = parseYAMLValue(value);
  });

  return result;
}

/**
 * Parse individual YAML values
 * Handles: strings, booleans, arrays, links
 */
function parseYAMLValue(value: string): any {
  if (!value) return null;

  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Number
  if (!isNaN(Number(value)) && value !== '') {
    return Number(value);
  }

  // Array with brackets [item1, item2]
  if (value.startsWith('[') && value.endsWith(']')) {
    const items = value
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim());
    return items;
  }

  // Obsidian links [[link1]], [[link2]]
  if (value.includes('[[') && value.includes(']]')) {
    const linkRegex = /\[\[([^\]]+)\]\]/g;
    const links: string[] = [];
    let match;
    while ((match = linkRegex.exec(value)) !== null) {
      links.push(match[1]);
    }
    return links;
  }

  // String (remove quotes if present)
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

/**
 * Create frontmatter from object
 * Converts object back to YAML format
 */
export function createFrontmatter(metadata: Frontmatter): string {
  const lines: string[] = ['---'];

  Object.entries(metadata).forEach(([key, value]) => {
    lines.push(`${key}: ${formatYAMLValue(value)}`);
  });

  lines.push('---');
  return lines.join('\n');
}

/**
 * Format value for YAML output
 */
function formatYAMLValue(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    // Check if array contains objects/links
    if (value.length === 0) return '[]';

    // Simple array: [item1, item2]
    const items = value.map((item) => {
      if (typeof item === 'string' && item.includes('[[')) {
        return item; // Already formatted as [[...]]
      }
      return typeof item === 'string' ? `"${item}"` : String(item);
    });

    return `[${items.join(', ')}]`;
  }

  if (typeof value === 'string') {
    // Quote strings that contain special characters
    if (value.includes(':') || value.includes('#') || value.includes('"')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }

  return String(value);
}

/**
 * Extract metadata from markdown file
 * Returns common metadata fields with defaults
 */
export interface ExtractedMetadata {
  source?: string;
  agent?: string;
  created_at?: string;
  updated_at?: string;
  project_id?: string;
  tags?: string[];
  links?: string[];
  title?: string;
  [key: string]: any;
}

export function extractMetadata(content: string): ExtractedMetadata {
  const parsed = parseFrontmatter(content);
  const meta: ExtractedMetadata = {};

  // Extract known fields
  if (parsed.frontmatter.source) meta.source = parsed.frontmatter.source;
  if (parsed.frontmatter.agent) meta.agent = parsed.frontmatter.agent;
  if (parsed.frontmatter.created_at) meta.created_at = parsed.frontmatter.created_at;
  if (parsed.frontmatter.updated_at) meta.updated_at = parsed.frontmatter.updated_at;
  if (parsed.frontmatter.project_id) meta.project_id = parsed.frontmatter.project_id;
  if (parsed.frontmatter.tags) meta.tags = parsed.frontmatter.tags;
  if (parsed.frontmatter.links) meta.links = parsed.frontmatter.links;
  if (parsed.frontmatter.title) meta.title = parsed.frontmatter.title;

  // Include any other fields
  Object.entries(parsed.frontmatter).forEach(([key, value]) => {
    if (!meta[key]) {
      meta[key] = value;
    }
  });

  return meta;
}

/**
 * Merge metadata with body content
 * Creates new markdown with updated frontmatter
 */
export function mergeFrontmatterWithBody(
  frontmatter: Frontmatter,
  body: string
): string {
  const frontmatterStr = createFrontmatter(frontmatter);
  return `${frontmatterStr}\n${body}`;
}

/**
 * Update specific metadata field
 * Returns updated markdown content
 */
export function updateMetadataField(
  content: string,
  key: string,
  value: any
): string {
  const parsed = parseFrontmatter(content);
  parsed.frontmatter[key] = value;
  return mergeFrontmatterWithBody(parsed.frontmatter, parsed.body);
}

/**
 * Get metadata value by key
 */
export function getMetadataValue(content: string, key: string): any {
  const parsed = parseFrontmatter(content);
  return parsed.frontmatter[key];
}
