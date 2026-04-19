#!/usr/bin/env node

/**
 * Phase 1.4: Data Migration Tool
 * 
 * Migrates existing Team-Studio JSON data to Vault format:
 * - Sessions: JSON messages → Markdown files with frontmatter
 * - Projects: context.md → Vault projects/{project_id}/context.md
 * 
 * Usage:
 *   node migrate.js --source ./data --target ./vault --dry-run
 *   node migrate.js --source ./data --target ./vault --execute
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Configuration
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Parse CLI arguments
const args = process.argv.slice(2);
const argMap = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    argMap[args[i].substring(2)] = args[i + 1] || true;
    i++;
  }
}

const SOURCE_DIR = argMap['source'] || './data';
const TARGET_DIR = argMap['target'] || './vault';
const DRY_RUN = argMap['dry-run'] !== undefined;
const EXECUTE = argMap['execute'] !== undefined;

// State tracking
const stats = {
  projectsProcessed: 0,
  sessionsProcessed: 0,
  messagesProcessed: 0,
  filesCreated: 0,
  filesSkipped: 0,
  errors: []
};

/**
 * Generate UUID v4
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Create frontmatter for a Vault file
 */
function createFrontmatter(id, fileType, title, tags = [], extras = {}) {
  const now = new Date().toISOString();
  return {
    id,
    type: fileType,
    created: now,
    updated: now,
    title: title || 'Untitled',
    tags,
    ...extras
  };
}

/**
 * Convert frontmatter object to YAML string
 */
function frontmatterToYAML(fm) {
  const lines = [];
  for (const [key, value] of Object.entries(fm)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:\n${value.map(v => `  - ${v}`).join('\n')}`);
    } else if (typeof value === 'object') {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join('\n');
}

/**
 * Create Markdown content from frontmatter + body
 */
function createMarkdownFile(frontmatter, body = '') {
  const fm = frontmatterToYAML(frontmatter);
  return `---\n${fm}\n---\n\n${body}`.trim() + '\n';
}

/**
 * Convert session messages to Markdown
 */
function sessionsToMarkdown(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'No messages in session.';
  }

  return messages
    .map((msg, idx) => {
      const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
      const timestamp = msg.timestamp ? new Date(msg.timestamp).toISOString() : '';
      const header = `\n## ${role}${timestamp ? ` — ${timestamp}` : ''}\n`;
      return header + (msg.content || '(empty)');
    })
    .join('\n---\n');
}

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

/**
 * Write file to disk
 */
async function writeFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  if (!DRY_RUN) {
    await fs.writeFile(filePath, content, 'utf8');
  }
  stats.filesCreated++;
}

/**
 * Migrate a single session JSON to Markdown
 */
async function migrateSession(projectId, sessionId, sessionData) {
  const fileId = generateUUID();
  const title = `Session: ${sessionId}`;
  
  // Create frontmatter
  const fm = createFrontmatter(
    fileId,
    'session',
    title,
    ['team-studio', 'session', projectId],
    { project_id: projectId, session_id: sessionId, migrated: true }
  );

  // Convert messages to markdown body
  const body = sessionsToMarkdown(sessionData.messages || []);

  // Create full markdown content
  const content = createMarkdownFile(fm, body);

  // Determine output path
  const outputPath = path.join(TARGET_DIR, 'projects', projectId, 'sessions', `${sessionId}.md`);

  // Write to disk
  try {
    await writeFile(outputPath, content);
    stats.messagesProcessed += (sessionData.messages || []).length;
    return { success: true, path: outputPath, fileId };
  } catch (err) {
    stats.errors.push(`Failed to migrate session ${sessionId}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Migrate project context and sessions
 */
async function migrateProject(projectId) {
  const projectPath = path.join(SOURCE_DIR, 'projects', projectId);
  
  try {
    const stats_local = { sessions: 0, context: 0 };

    // Migrate context.md if exists
    try {
      const contextPath = path.join(projectPath, 'context.md');
      const contextContent = await fs.readFile(contextPath, 'utf8');
      
      if (contextContent.trim().length > 0) {
        const fileId = generateUUID();
        const fm = createFrontmatter(
          fileId,
          'project',
          `Project: ${projectId}`,
          ['team-studio', 'project'],
          { project_id: projectId, migrated: true }
        );
        
        const markdown = createMarkdownFile(fm, contextContent);
        const outputPath = path.join(TARGET_DIR, 'projects', projectId, 'context.md');
        await writeFile(outputPath, markdown);
        stats_local.context = 1;
      }
    } catch (err) {
      // context.md might not exist, that's ok
    }

    // Migrate sessions
    const sessionsPath = path.join(projectPath, 'sessions');
    try {
      const sessionFiles = await fs.readdir(sessionsPath);
      
      for (const sessionFile of sessionFiles) {
        if (!sessionFile.endsWith('.json')) continue;
        
        const sessionId = sessionFile.replace('.json', '');
        const sessionPath = path.join(sessionsPath, sessionFile);
        const sessionContent = await fs.readFile(sessionPath, 'utf8');
        const sessionData = JSON.parse(sessionContent);

        const result = await migrateSession(projectId, sessionId, sessionData);
        if (result.success) {
          stats_local.sessions++;
        }
      }
    } catch (err) {
      // sessions directory might not exist
    }

    return stats_local;

  } catch (err) {
    stats.errors.push(`Failed to migrate project ${projectId}: ${err.message}`);
    return { sessions: 0, context: 0 };
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log(`${COLORS.blue}🚀 Phase 1.4: Data Migration Tool${COLORS.reset}`);
  console.log(`${COLORS.cyan}Source: ${SOURCE_DIR}${COLORS.reset}`);
  console.log(`${COLORS.cyan}Target: ${TARGET_DIR}${COLORS.reset}`);
  console.log(`${COLORS.yellow}Mode: ${DRY_RUN ? 'DRY-RUN (no files written)' : 'EXECUTE (files will be written)'}${COLORS.reset}`);
  console.log('');

  try {
    // Check source directory
    const projectsDir = path.join(SOURCE_DIR, 'projects');
    await fs.access(projectsDir);

    // Get list of projects
    const projectDirs = await fs.readdir(projectsDir);
    console.log(`Found ${projectDirs.length} projects to migrate:\n`);

    // Migrate each project
    for (const projectId of projectDirs) {
      const projectPath = path.join(projectsDir, projectId);
      const stat = await fs.stat(projectPath);
      
      if (!stat.isDirectory()) continue;

      process.stdout.write(`  📁 ${projectId.padEnd(20)} → `);
      
      const result = await migrateProject(projectId);
      console.log(`${COLORS.green}✓${COLORS.reset} (${result.context} context, ${result.sessions} sessions)`);
      
      stats.projectsProcessed++;
      stats.sessionsProcessed += result.sessions;
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log(`${COLORS.green}📊 Migration Summary${COLORS.reset}`);
    console.log('='.repeat(60));
    console.log(`Projects processed:   ${stats.projectsProcessed}`);
    console.log(`Sessions migrated:    ${stats.sessionsProcessed}`);
    console.log(`Messages processed:   ${stats.messagesProcessed}`);
    console.log(`Files created:        ${stats.filesCreated}`);
    
    if (stats.errors.length > 0) {
      console.log(`\n${COLORS.red}⚠️  Errors (${stats.errors.length}):${COLORS.reset}`);
      stats.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('');
    if (DRY_RUN) {
      console.log(`${COLORS.yellow}✓ Dry-run complete. No files were written.${COLORS.reset}`);
      console.log(`${COLORS.cyan}Run with --execute to perform actual migration.${COLORS.reset}`);
    } else {
      console.log(`${COLORS.green}✓ Migration complete! Data migrated to ${TARGET_DIR}${COLORS.reset}`);
    }

  } catch (err) {
    console.error(`${COLORS.red}❌ Migration failed:${COLORS.reset} ${err.message}`);
    process.exit(1);
  }
}

// Run migration
runMigration().catch(err => {
  console.error(`${COLORS.red}Fatal error:${COLORS.reset}`, err);
  process.exit(1);
});
